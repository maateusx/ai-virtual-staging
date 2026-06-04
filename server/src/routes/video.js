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
  DEFAULT_VIDEO_MODEL,
} from '../services/video/registry.js';
import {
  publicMotions,
  isValidMotion,
  composeVideoPrompt,
  DEFAULT_MOTION,
} from '../services/video/motionPresets.js';
import { trackJob } from '../services/video/poller.js';
import { saveBuffer, extForMime } from '../services/storage.js';
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
    motion: job.motion ?? null,
    aspect_ratio: job.aspect_ratio,
    resolution: job.resolution,
    duration_seconds: job.duration_seconds,
    audio: job.audio,
    input_image_url: job.input_image_url,
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
    let model = DEFAULT_VIDEO_MODEL;
    let aspectRatio = null;
    let resolution = null;
    let duration = null;
    let motion = DEFAULT_MOTION;
    let prompt = '';
    let audio = false;
    let geminiApiKey = '';

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'image') {
          imageMime = part.mimetype;
          imageBuffer = await part.toBuffer();
        } else {
          part.file.resume();
        }
      } else {
        if (part.fieldname === 'model' && part.value) model = part.value;
        else if (part.fieldname === 'aspect_ratio' && part.value) aspectRatio = part.value;
        else if (part.fieldname === 'resolution' && part.value) resolution = part.value;
        else if (part.fieldname === 'duration' && part.value)
          duration = Number.parseInt(part.value, 10);
        else if (part.fieldname === 'motion' && part.value) motion = part.value;
        else if (part.fieldname === 'prompt') prompt = part.value || '';
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
    if (!isValidMotion(motion)) {
      return reply.code(422).send({ error: `invalid motion: ${motion}` });
    }

    // The chosen camera-motion preset + the optional free-text detail are merged
    // into the final prompt, always wrapped with the "only the camera moves,
    // nothing in the room changes" lock. The user never writes the room itself.
    const composedPrompt = composeVideoPrompt(motion, prompt);

    // A Gemini key is required: caller-supplied (BYOK) or the server's own.
    if (!geminiApiKey && !env.gemini.enabled) {
      return reply
        .code(422)
        .send({ error: 'Gemini API key required: paste your own key to continue' });
    }

    // Persist the input image.
    const input = await saveBuffer(imageBuffer, extForMime(imageMime), 'in');

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
        apiKey: geminiApiKey,
      });

      const job = await VideoJob.create({
        status: 'processing',
        provider: descriptor.provider,
        model,
        motion,
        prompt: composedPrompt,
        aspect_ratio: aspectRatio,
        resolution,
        duration_seconds: duration,
        audio,
        input_image_url: input.url,
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
