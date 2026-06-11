import { VideoJob } from '../models/VideoJob.js';
import {
  startVideo,
  ProviderError,
  MissingApiKeyError,
} from '../services/video/videoProvider.js';
import {
  publicVideoConfig,
  getModelDescriptor,
  validateVideoParams,
  modelSupportsLastFrame,
  DEFAULT_VIDEO_MODEL,
} from '../services/video/registry.js';
import {
  publicMotions,
  isValidMotion,
  composeVideoPrompt,
  DEFAULT_MOTION,
  publicStyles,
  isValidStyle,
  composeTransformPrompt,
  DEFAULT_STYLE,
  DEFAULT_TRANSFORM_PROMPT,
} from '../services/video/motionPresets.js';
import { trackJob } from '../services/video/poller.js';
import { saveBuffer, extForMime } from '../services/storage.js';
import { estimateCost } from '../services/pricing.js';
// AUTO transform mode generates the final frame inline via the (synchronous)
// image staging pipeline. Its error classes are DISTINCT from the video
// provider's (separate definitions in imageProvider.js), so alias them.
import {
  generateStaging,
  MissingApiKeyError as ImageMissingKeyError,
  ProviderError as ImageProviderError,
} from '../services/imageProvider.js';
import { composeFinalFramePrompt } from '../services/promptBuilder.js';
import { env } from '../config/env.js';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_PROMPT_CHARS = 2000; // Veo caps the prompt; keep it bounded.

// Shape a job document into the public API response.
function publicJob(job) {
  return {
    job_id: job.id,
    status: job.status,
    model: job.model,
    style: job.style ?? 'motion',
    motion: job.motion ?? null,
    final_frame_mode: job.final_frame_mode ?? null,
    aspect_ratio: job.aspect_ratio,
    resolution: job.resolution,
    duration_seconds: job.duration_seconds,
    audio: job.audio,
    input_image_url: job.input_image_url,
    input_image_final_url: job.input_image_final_url ?? null,
    result_video_url: job.output_video_url ?? null,
    processing_ms: job.processing_ms ?? null,
    cost: job.cost ?? null,
    error: job.error ?? null,
  };
}

export async function videoRoutes(app) {
  // --- Public model registry (no secrets) -----------------------------------
  app.get('/v1/video/config', async () => ({
    ...publicVideoConfig(),
    // Top-level styles: 'motion' (camera moves, room frozen) and 'transform'
    // (first→last frame renovation/timelapse). Each model carries a
    // supports_last_frame flag the UI uses to gate the 'transform' style.
    styles: publicStyles(),
    default_style: DEFAULT_STYLE,
    default_transform_prompt: DEFAULT_TRANSFORM_PROMPT,
    // Camera-motion presets (how the camera moves through the unchanged room).
    motions: publicMotions(),
    default_motion: DEFAULT_MOTION,
    // When false, the client MUST supply its own Gemini key (BYOK).
    server_has_key: env.gemini.enabled,
  }));

  // --- Create an async video job --------------------------------------------
  app.post('/v1/video', async (request, reply) => {
    let imageBuffer = null;
    let imageMime = null;
    let image2Buffer = null; // 'transform' style: user-uploaded final frame (MANUAL)
    let image2Mime = null;
    let model = DEFAULT_VIDEO_MODEL;
    let style = DEFAULT_STYLE;
    let aspectRatio = null;
    let resolution = null;
    let duration = null;
    let motion = DEFAULT_MOTION;
    let prompt = '';
    let stagingPrompt = ''; // 'transform' AUTO mode: how to generate the "after" frame
    let audio = false;
    let geminiApiKey = '';

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'image') {
          imageMime = part.mimetype;
          imageBuffer = await part.toBuffer();
        } else if (part.fieldname === 'image2') {
          image2Mime = part.mimetype;
          image2Buffer = await part.toBuffer();
        } else {
          part.file.resume();
        }
      } else {
        if (part.fieldname === 'model' && part.value) model = part.value;
        else if (part.fieldname === 'style' && part.value) style = part.value;
        else if (part.fieldname === 'aspect_ratio' && part.value) aspectRatio = part.value;
        else if (part.fieldname === 'resolution' && part.value) resolution = part.value;
        else if (part.fieldname === 'duration' && part.value)
          duration = Number.parseInt(part.value, 10);
        else if (part.fieldname === 'motion' && part.value) motion = part.value;
        else if (part.fieldname === 'prompt') prompt = part.value || '';
        else if (part.fieldname === 'staging_prompt') stagingPrompt = part.value || '';
        else if (part.fieldname === 'audio' && part.value)
          audio = part.value === 'true' || part.value === '1';
        // User-supplied Gemini key (BYOK). Never logged or persisted.
        else if (part.fieldname === 'gemini_api_key') geminiApiKey = (part.value || '').trim();
      }
    }

    // Validation (422).
    if (!imageBuffer) {
      return reply.code(422).send({ error: 'image is required' });
    }
    if (!ALLOWED_MIME.has(imageMime)) {
      return reply.code(422).send({ error: `unsupported image type: ${imageMime}` });
    }
    if (imageBuffer.length > MAX_IMAGE_BYTES) {
      return reply.code(422).send({ error: 'image too large (max 15MB)' });
    }

    const descriptor = getModelDescriptor(model);
    if (!descriptor) {
      return reply.code(422).send({ error: `invalid model: ${model}` });
    }
    // Default any unspecified knobs from the model's own defaults.
    aspectRatio = aspectRatio ?? descriptor.defaults.aspectRatio;
    resolution = resolution ?? descriptor.defaults.resolution;
    duration = duration ?? descriptor.defaults.duration;

    const paramError = validateVideoParams({ model, aspectRatio, resolution, duration, audio });
    if (paramError) {
      return reply.code(422).send({ error: paramError });
    }
    if (typeof prompt === 'string' && prompt.length > MAX_PROMPT_CHARS) {
      return reply
        .code(422)
        .send({ error: `prompt too long (max ${MAX_PROMPT_CHARS} chars)` });
    }
    if (!isValidStyle(style)) {
      return reply.code(422).send({ error: `invalid style: ${style}` });
    }

    // --- Style-specific validation + final frame resolution -------------------
    // 'transform' uses a first→last frame; 'motion' uses a single frame + a
    // camera-motion preset. `finalFrameMode` is 'manual' (image2 uploaded) or
    // 'auto' (AI-generate the "after" frame from the input) for transform jobs.
    let finalFrameMode = null;
    if (style === 'transform') {
      if (!modelSupportsLastFrame(model)) {
        return reply
          .code(422)
          .send({ error: `model ${model} does not support the transformação style` });
      }
      if (image2Buffer) {
        if (!ALLOWED_MIME.has(image2Mime)) {
          return reply.code(422).send({ error: `unsupported final image type: ${image2Mime}` });
        }
        if (image2Buffer.length > MAX_IMAGE_BYTES) {
          return reply.code(422).send({ error: 'final image too large (max 15MB)' });
        }
      }
      finalFrameMode = image2Buffer ? 'manual' : 'auto';
    } else if (!isValidMotion(motion)) {
      return reply.code(422).send({ error: `invalid motion: ${motion}` });
    }

    // Compose the final prompt by style. Both composers always append their lock
    // last: 'motion' the strict STILL_SCENE, 'transform' the light geometry lock.
    const composedPrompt =
      style === 'transform' ? composeTransformPrompt(prompt) : composeVideoPrompt(motion, prompt);

    // A Gemini key is required: caller-supplied (BYOK) or the server's own.
    if (!geminiApiKey && !env.gemini.enabled) {
      return reply
        .code(422)
        .send({ error: 'Gemini API key required: paste your own key to continue' });
    }

    // Persist the input (first) frame.
    const input = await saveBuffer(imageBuffer, extForMime(imageMime), 'in');

    // Resolve the final frame for transform jobs BEFORE creating the job, so a
    // staging failure surfaces synchronously (422/502) and never leaves an orphan
    // job. MANUAL uses the upload; AUTO runs the image staging pipeline inline.
    let lastFrameBuffer = null;
    let lastFrameMime = null;
    let finalSaved = null;
    let stagingCost = null;
    if (style === 'transform') {
      if (finalFrameMode === 'manual') {
        lastFrameBuffer = image2Buffer;
        lastFrameMime = image2Mime;
      } else {
        // AUTO: generate the "after" frame from the input. No imageConfig — let
        // staging preserve the input's geometry/dimensions (FINAL_FRAME_PRESERVE
        // lock) so the generated last frame matches the first frame (Veo requires
        // the same aspect ratio for first and last frame).
        const stagingComposed = composeFinalFramePrompt(stagingPrompt);
        try {
          const staged = await generateStaging({
            imageBuffer,
            mime: imageMime,
            prompt: stagingComposed,
            apiKey: geminiApiKey,
          });
          lastFrameBuffer = staged.buffer;
          lastFrameMime = staged.mime;
          if (staged.usage) {
            stagingCost = estimateCost({
              prompt_tokens: staged.usage.promptTokens,
              output_tokens: staged.usage.outputTokens,
            });
          }
        } catch (err) {
          if (err instanceof ImageMissingKeyError) {
            return reply
              .code(422)
              .send({ error: 'Gemini API key required: paste your own key to continue' });
          }
          if (err instanceof ImageProviderError) {
            request.log.error({ err: err.cause ?? err }, 'auto staging for transform failed');
            return reply.code(502).send({
              error:
                'não foi possível gerar o quadro final automaticamente — envie um quadro final ou tente novamente',
            });
          }
          throw err;
        }
      }
      finalSaved = await saveBuffer(lastFrameBuffer, extForMime(lastFrameMime), 'in');
    }

    // Kick off the provider operation, then create the job and start polling.
    try {
      const { operationName, operation } = await startVideo({
        imageBuffer,
        mime: imageMime,
        prompt: composedPrompt,
        model,
        aspectRatio,
        resolution,
        durationSeconds: duration,
        audio,
        lastFrameBuffer,
        lastFrameMime,
        apiKey: geminiApiKey,
      });

      const job = await VideoJob.create({
        status: 'processing',
        provider: descriptor.provider,
        model,
        style,
        motion: style === 'motion' ? motion : undefined,
        final_frame_mode: style === 'transform' ? finalFrameMode : undefined,
        prompt: composedPrompt,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: duration,
        audio,
        input_image_url: input.url,
        input_image_final_url: finalSaved?.url,
        // Stash the AUTO staging cost so the poller can fold it into the final
        // cost (the poller overwrites `cost` when the video completes).
        cost: stagingCost
          ? { staging_usd: stagingCost.usd, staging_brl: stagingCost.brl }
          : undefined,
        operation_name: operationName,
        started_at: new Date(),
      });

      // Fire-and-forget background poller.
      trackJob({
        jobId: job.id,
        model,
        operation,
        operationName,
        apiKey: geminiApiKey,
        logger: request.log,
      });

      return reply.code(202).send({ job_id: job.id, status: job.status });
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        return reply
          .code(422)
          .send({ error: 'Gemini API key required: paste your own key to continue' });
      }
      if (err instanceof ProviderError) {
        request.log.error({ err: err.cause ?? err }, 'video provider start failure');
        return reply.code(502).send({
          error: geminiApiKey
            ? 'video provider failed — check that your Gemini API key is valid'
            : 'video provider failed',
        });
      }
      throw err;
    }
  });

  // --- Poll a job's status / result -----------------------------------------
  app.get('/v1/video/:id', async (request, reply) => {
    const job = await VideoJob.findById(request.params.id).catch(() => null);
    if (!job) return reply.code(404).send({ error: 'job not found' });
    return publicJob(job);
  });
}
