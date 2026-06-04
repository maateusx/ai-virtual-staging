import { StagingParameter } from '../models/StagingParameter.js';
import { StagingJob } from '../models/StagingJob.js';
import {
  composePrompt,
  composeEditPrompt,
  isValidMode,
  EDIT_MODE,
  STAGING_MODES,
  DEFAULT_MODE,
} from '../services/promptBuilder.js';
import { generateStaging, ProviderError, MissingApiKeyError } from '../services/imageProvider.js';
import { compositeEdit } from '../services/inpaint.js';
import { estimateCost } from '../services/pricing.js';
import { env } from '../config/env.js';
import { saveBuffer, extForMime } from '../services/storage.js';
import {
  isValidAspectRatio,
  isValidImageSize,
  isValidAspectFit,
  resolveImageConfig,
  aspectRatioValue,
  publicOutputConfig,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_ASPECT_FIT,
} from '../services/outputFormats.js';
import { reframe, expandWithAi } from '../services/reframe.js';
import {
  applyWatermark,
  isValidWatermarkVertical,
  isValidWatermarkHorizontal,
  isValidWatermarkSize,
  isValidWatermarkOpacity,
  isValidWatermarkColor,
  DEFAULT_WATERMARK_VERTICAL,
  DEFAULT_WATERMARK_HORIZONTAL,
  DEFAULT_WATERMARK_SIZE,
  DEFAULT_WATERMARK_OPACITY,
  MIN_WATERMARK_SIZE,
  MAX_WATERMARK_SIZE,
  MIN_WATERMARK_OPACITY,
  MAX_WATERMARK_OPACITY,
} from '../services/watermark.js';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_VARIATIONS = 4;
// Upper bound for a user-edited prompt override (the auto-composed prompt is
// ~1-2k chars; this leaves generous room while bounding abuse).
const MAX_PROMPT_CHARS = 8000;

// Compose the final instruction from the request parameters, without touching
// any image. Shared by the preview endpoint and the main process route.
async function buildPrompt({ mode, selections, extraPrompt }) {
  if (mode === EDIT_MODE) {
    return composeEditPrompt(extraPrompt).composedPrompt;
  }
  const parameters = await StagingParameter.find({ active: true }).sort({ order: 1 });
  return composePrompt(parameters, selections, extraPrompt, mode).composedPrompt;
}

export async function stagingRoutes(app) {
  // --- 5.1 Public config (no prompt_fragment exposed) -----------------------
  app.get('/v1/staging/config', async () => {
    const params = await StagingParameter.find({ active: true }).sort({ order: 1 });
    return {
      parameters: params.map((p) => p.toPublic()),
      output: publicOutputConfig(),
      modes: STAGING_MODES,
      default_mode: DEFAULT_MODE,
      // When false, the client MUST supply its own Gemini key (BYOK).
      server_has_key: env.gemini.enabled,
    };
  });

  // --- Prompt preview: compose the final instruction without generating ------
  // Lets the UI show (and let the user edit) the exact prompt before running a
  // real, billed generation. Same composition logic as the process route.
  app.post('/v1/staging/preview-prompt', async (request, reply) => {
    const body = request.body ?? {};
    const mode = body.mode || DEFAULT_MODE;
    const selections = body.selections ?? {};
    const extraPrompt = typeof body.extra_prompt === 'string' ? body.extra_prompt : '';

    if (!isValidMode(mode)) {
      return reply.code(422).send({ error: `invalid mode: ${mode}` });
    }
    if (typeof selections !== 'object' || Array.isArray(selections)) {
      return reply.code(422).send({ error: 'selections must be an object' });
    }

    const composedPrompt = await buildPrompt({ mode, selections, extraPrompt });
    return { composed_prompt: composedPrompt };
  });

  // --- 5.2 Process image (synchronous) --------------------------------------
  app.post('/v1/staging', async (request, reply) => {
    const started = Date.now();

    // Parse multipart: the image (+ optional mask) file + text fields.
    let imageBuffer = null;
    let imageMime = null;
    let maskBuffer = null;
    let maskMime = null;
    let selectionsRaw = null;
    let extraPrompt = '';
    let mode = DEFAULT_MODE;
    let aspectRatio = DEFAULT_ASPECT_RATIO;
    let imageSize = DEFAULT_IMAGE_SIZE;
    let aspectFit = DEFAULT_ASPECT_FIT;
    let geminiApiKey = '';
    let variations = 1;
    let promptOverride = '';
    // Optional local watermark: a user-supplied PNG stamped over the output with
    // sharp (no model call). Position is a vertical × horizontal band; size is a
    // percentage of the output width.
    let watermarkBuffer = null;
    let watermarkMime = null;
    let watermarkVertical = DEFAULT_WATERMARK_VERTICAL;
    let watermarkHorizontal = DEFAULT_WATERMARK_HORIZONTAL;
    let watermarkSize = DEFAULT_WATERMARK_SIZE;
    let watermarkOpacity = DEFAULT_WATERMARK_OPACITY;
    let watermarkColor = null; // hex string, or null for the mark's own colours

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'image') {
          imageMime = part.mimetype;
          imageBuffer = await part.toBuffer();
        } else if (part.fieldname === 'mask') {
          maskMime = part.mimetype;
          maskBuffer = await part.toBuffer();
        } else if (part.fieldname === 'watermark') {
          watermarkMime = part.mimetype;
          watermarkBuffer = await part.toBuffer();
        } else {
          part.file.resume();
        }
      } else {
        if (part.fieldname === 'selections') selectionsRaw = part.value;
        else if (part.fieldname === 'extra_prompt') extraPrompt = part.value || '';
        else if (part.fieldname === 'mode' && part.value) mode = part.value;
        else if (part.fieldname === 'aspect_ratio' && part.value) aspectRatio = part.value;
        else if (part.fieldname === 'image_size' && part.value) imageSize = part.value;
        else if (part.fieldname === 'aspect_fit' && part.value) aspectFit = part.value;
        // User-supplied Gemini key (optional). Never logged or persisted.
        else if (part.fieldname === 'gemini_api_key') geminiApiKey = (part.value || '').trim();
        else if (part.fieldname === 'variations' && part.value)
          variations = Number.parseInt(part.value, 10);
        // User-edited final prompt. When present, it replaces the auto-composed
        // one verbatim (the UI seeds it from the preview endpoint).
        else if (part.fieldname === 'prompt_override') promptOverride = part.value || '';
        else if (part.fieldname === 'watermark_vertical' && part.value)
          watermarkVertical = part.value;
        else if (part.fieldname === 'watermark_horizontal' && part.value)
          watermarkHorizontal = part.value;
        else if (part.fieldname === 'watermark_size' && part.value)
          watermarkSize = Number.parseFloat(part.value);
        else if (part.fieldname === 'watermark_opacity' && part.value)
          watermarkOpacity = Number.parseFloat(part.value);
        else if (part.fieldname === 'watermark_color' && part.value)
          watermarkColor = part.value.trim();
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

    let selections = {};
    if (selectionsRaw) {
      try {
        selections = JSON.parse(selectionsRaw);
      } catch {
        return reply.code(422).send({ error: 'selections must be valid JSON' });
      }
    }
    if (typeof selections !== 'object' || Array.isArray(selections)) {
      return reply.code(422).send({ error: 'selections must be an object' });
    }

    if (!isValidMode(mode)) {
      return reply.code(422).send({ error: `invalid mode: ${mode}` });
    }
    if (!isValidAspectRatio(aspectRatio)) {
      return reply.code(422).send({ error: `invalid aspect_ratio: ${aspectRatio}` });
    }
    if (!isValidImageSize(imageSize)) {
      return reply.code(422).send({ error: `invalid image_size: ${imageSize}` });
    }
    if (!isValidAspectFit(aspectFit)) {
      return reply.code(422).send({ error: `invalid aspect_fit: ${aspectFit}` });
    }
    if (!Number.isInteger(variations) || variations < 1 || variations > MAX_VARIATIONS) {
      return reply
        .code(422)
        .send({ error: `variations must be an integer between 1 and ${MAX_VARIATIONS}` });
    }
    promptOverride = promptOverride.trim();
    if (promptOverride.length > MAX_PROMPT_CHARS) {
      return reply
        .code(422)
        .send({ error: `prompt_override too long (max ${MAX_PROMPT_CHARS} chars)` });
    }
    // Validate the optional watermark (only when a PNG was supplied).
    if (watermarkBuffer) {
      if (watermarkMime !== 'image/png') {
        return reply.code(422).send({ error: 'watermark must be a PNG' });
      }
      if (watermarkBuffer.length > MAX_IMAGE_BYTES) {
        return reply.code(422).send({ error: 'watermark too large (max 15MB)' });
      }
      if (!isValidWatermarkVertical(watermarkVertical)) {
        return reply
          .code(422)
          .send({ error: `invalid watermark_vertical: ${watermarkVertical}` });
      }
      if (!isValidWatermarkHorizontal(watermarkHorizontal)) {
        return reply
          .code(422)
          .send({ error: `invalid watermark_horizontal: ${watermarkHorizontal}` });
      }
      if (!isValidWatermarkSize(watermarkSize)) {
        return reply.code(422).send({
          error: `watermark_size must be between ${MIN_WATERMARK_SIZE} and ${MAX_WATERMARK_SIZE}`,
        });
      }
      if (!isValidWatermarkOpacity(watermarkOpacity)) {
        return reply.code(422).send({
          error: `watermark_opacity must be between ${MIN_WATERMARK_OPACITY} and ${MAX_WATERMARK_OPACITY}`,
        });
      }
      // Color is optional; reject only a malformed value when one is supplied.
      if (watermarkColor && !isValidWatermarkColor(watermarkColor)) {
        return reply
          .code(422)
          .send({ error: `invalid watermark_color: ${watermarkColor} (expected hex like #ffffff)` });
      }
    }

    // A Gemini key is required: caller-supplied (BYOK) or the server's own.
    if (!geminiApiKey && !env.gemini.enabled) {
      return reply
        .code(422)
        .send({ error: 'Gemini API key required: paste your own key to continue' });
    }

    const isEdit = mode === EDIT_MODE;

    // Localized-edit mode requires a painted mask + a free-text instruction.
    if (isEdit) {
      if (!maskBuffer) {
        return reply.code(422).send({ error: 'mask is required for edit mode' });
      }
      if (!ALLOWED_MIME.has(maskMime)) {
        return reply.code(422).send({ error: `unsupported mask type: ${maskMime}` });
      }
      if (maskBuffer.length > MAX_IMAGE_BYTES) {
        return reply.code(422).send({ error: 'mask too large (max 15MB)' });
      }
      if (!extraPrompt.trim()) {
        return reply
          .code(422)
          .send({ error: 'extra_prompt (edit instruction) is required for edit mode' });
      }
    }

    // Persist input image (and the mask, when editing).
    const inExt = extForMime(imageMime);
    const input = await saveBuffer(imageBuffer, inExt, 'in');
    let maskUrl = null;
    if (isEdit) {
      const maskSaved = await saveBuffer(maskBuffer, extForMime(maskMime), 'in');
      maskUrl = maskSaved.url;
    }

    // Resolve the final prompt. A user-edited override wins verbatim; otherwise
    // compose from parameters (edit mode is mask-driven and skips style params).
    const composedPrompt = promptOverride || (await buildPrompt({ mode, selections, extraPrompt }));

    const imageConfig = resolveImageConfig({ imageSizeId: imageSize });
    const ratioValue = aspectRatioValue(aspectRatio);

    // Stamp the optional watermark (local, no model call) and persist the result.
    // Shared by the normal and edit flows so every output goes through it.
    const finalizeOutput = async (buffer, mime) => {
      if (watermarkBuffer) {
        const stamped = await applyWatermark({
          buffer,
          mime,
          watermarkBuffer,
          vertical: watermarkVertical,
          horizontal: watermarkHorizontal,
          size: watermarkSize,
          opacity: watermarkOpacity,
          color: watermarkColor,
        });
        buffer = stamped.buffer;
        mime = stamped.mime;
      }
      return saveBuffer(buffer, extForMime(mime), 'out');
    };

    // Produce one staged variation: generate → adjust aspect ratio → save.
    // The model is stochastic, so calling this N times yields distinct results.
    const runVariation = async () => {
      // Accumulate token usage across every model call this variation makes
      // (the base generation + the second pass when expanding with AI).
      const usage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };
      const track = (u) => {
        if (!u) return;
        usage.promptTokens += u.promptTokens;
        usage.outputTokens += u.outputTokens;
        usage.totalTokens += u.totalTokens;
      };

      const result = await generateStaging({
        imageBuffer,
        mime: imageMime,
        prompt: composedPrompt,
        imageConfig,
        apiKey: geminiApiKey,
      });
      track(result.usage);

      // Adjust the aspect ratio. crop/pad are deterministic (the model never
      // invents content); 'ai' outpaints — the model extends the scene to fill
      // the new frame with a second generation call.
      const framed =
        aspectFit === 'ai'
          ? await expandWithAi({
              buffer: result.buffer,
              mime: result.mime,
              ratio: ratioValue,
              generate: async (buf, m, prompt) => {
                const r = await generateStaging({
                  imageBuffer: buf,
                  mime: m,
                  prompt,
                  imageConfig,
                  apiKey: geminiApiKey,
                });
                track(r.usage);
                return r;
              },
            })
          : await reframe({
              buffer: result.buffer,
              mime: result.mime,
              ratio: ratioValue,
              fit: aspectFit,
            });

      const output = await finalizeOutput(framed.buffer, framed.mime);
      return { url: output.url, model: result.model, usage };
    };

    // Localized edit: send photo + mask, then composite the result back over the
    // original so everything outside the painted region stays identical. No
    // aspect-ratio step — the output keeps the original dimensions.
    const runEditVariation = async () => {
      const result = await generateStaging({
        imageBuffer,
        mime: imageMime,
        prompt: composedPrompt,
        maskBuffer,
        maskMime,
        apiKey: geminiApiKey,
      });

      const composited = await compositeEdit({
        originalBuffer: imageBuffer,
        editedBuffer: result.buffer,
        maskBuffer,
      });

      const output = await finalizeOutput(composited.buffer, composited.mime);
      return { url: output.url, model: result.model, usage: result.usage };
    };

    try {
      // Generate all variations concurrently; partial success is acceptable.
      const settled = await Promise.allSettled(
        Array.from({ length: variations }, () => (isEdit ? runEditVariation() : runVariation()))
      );
      const outputs = settled
        .filter((s) => s.status === 'fulfilled')
        .map((s) => s.value);

      // Every variation failed → surface the first error via the catch below.
      if (outputs.length === 0) {
        throw settled.find((s) => s.status === 'rejected').reason;
      }

      const urls = outputs.map((o) => o.url);
      const model = outputs[0].model;
      const processingMs = Date.now() - started;

      // Sum token usage across all variations.
      const usage = outputs.reduce(
        (acc, o) => ({
          prompt_tokens: acc.prompt_tokens + (o.usage?.promptTokens ?? 0),
          output_tokens: acc.output_tokens + (o.usage?.outputTokens ?? 0),
          total_tokens: acc.total_tokens + (o.usage?.totalTokens ?? 0),
        }),
        { prompt_tokens: 0, output_tokens: 0, total_tokens: 0 }
      );

      // Estimated cost (USD + BRL) for this request, from token usage.
      const cost = estimateCost(usage);

      await StagingJob.create({
        input_image_url: input.url,
        mask_image_url: maskUrl,
        output_image_url: urls[0],
        output_image_urls: urls,
        mode,
        selections,
        extra_prompt: extraPrompt,
        composed_prompt: composedPrompt,
        aspect_ratio: aspectRatio,
        aspect_fit: aspectFit,
        image_size: imageSize,
        watermark: watermarkBuffer
          ? {
              vertical: watermarkVertical,
              horizontal: watermarkHorizontal,
              size: watermarkSize,
              opacity: watermarkOpacity,
              color: watermarkColor || undefined,
            }
          : undefined,
        model,
        processing_ms: processingMs,
        usage,
        cost,
        status: 'done',
      });

      return {
        result_image_url: urls[0], // back-compat: first variation
        variations: urls.map((url) => ({ result_image_url: url })),
        requested_variations: variations,
        composed_prompt: composedPrompt,
        mode,
        aspect_ratio: aspectRatio,
        aspect_fit: aspectFit,
        image_size: imageSize,
        model,
        processing_ms: processingMs,
        usage,
        cost,
      };
    } catch (err) {
      await StagingJob.create({
        input_image_url: input.url,
        mask_image_url: maskUrl,
        mode,
        selections,
        extra_prompt: extraPrompt,
        composed_prompt: composedPrompt,
        aspect_ratio: aspectRatio,
        aspect_fit: aspectFit,
        image_size: imageSize,
        status: 'error',
        error: err.message,
      });

      if (err instanceof MissingApiKeyError) {
        return reply
          .code(422)
          .send({ error: 'Gemini API key required: paste your own key to continue' });
      }
      if (err instanceof ProviderError) {
        request.log.error({ err: err.cause ?? err }, 'provider failure');
        return reply.code(502).send({
          error: geminiApiKey
            ? 'image provider failed — check that your Gemini API key is valid'
            : 'image provider failed',
        });
      }
      throw err;
    }
  });
}
