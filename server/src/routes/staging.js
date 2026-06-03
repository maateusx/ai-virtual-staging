import { StagingParameter } from '../models/StagingParameter.js';
import { StagingJob } from '../models/StagingJob.js';
import {
  composePrompt,
  isValidMode,
  STAGING_MODES,
  DEFAULT_MODE,
} from '../services/promptBuilder.js';
import { generateStaging, ProviderError } from '../services/imageProvider.js';
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

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export async function stagingRoutes(app) {
  // --- 5.1 Public config (no prompt_fragment exposed) -----------------------
  app.get('/v1/staging/config', async () => {
    const params = await StagingParameter.find({ active: true }).sort({ order: 1 });
    return {
      parameters: params.map((p) => p.toPublic()),
      output: publicOutputConfig(),
      modes: STAGING_MODES,
      default_mode: DEFAULT_MODE,
    };
  });

  // --- 5.2 Process image (synchronous) --------------------------------------
  app.post('/v1/staging', async (request, reply) => {
    const started = Date.now();

    // Parse multipart: one image file + text fields.
    let imageBuffer = null;
    let imageMime = null;
    let selectionsRaw = null;
    let extraPrompt = '';
    let mode = DEFAULT_MODE;
    let aspectRatio = DEFAULT_ASPECT_RATIO;
    let imageSize = DEFAULT_IMAGE_SIZE;
    let aspectFit = DEFAULT_ASPECT_FIT;

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname !== 'image') {
          part.file.resume();
          continue;
        }
        imageMime = part.mimetype;
        imageBuffer = await part.toBuffer();
      } else {
        if (part.fieldname === 'selections') selectionsRaw = part.value;
        else if (part.fieldname === 'extra_prompt') extraPrompt = part.value || '';
        else if (part.fieldname === 'mode' && part.value) mode = part.value;
        else if (part.fieldname === 'aspect_ratio' && part.value) aspectRatio = part.value;
        else if (part.fieldname === 'image_size' && part.value) imageSize = part.value;
        else if (part.fieldname === 'aspect_fit' && part.value) aspectFit = part.value;
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

    // Persist input image.
    const inExt = extForMime(imageMime);
    const input = await saveBuffer(imageBuffer, inExt, 'in');

    // Resolve fragments + compose prompt.
    const parameters = await StagingParameter.find({ active: true }).sort({ order: 1 });
    const { composedPrompt } = composePrompt(parameters, selections, extraPrompt, mode);

    try {
      const imageConfig = resolveImageConfig({ imageSizeId: imageSize });
      const result = await generateStaging({
        imageBuffer,
        mime: imageMime,
        prompt: composedPrompt,
        imageConfig,
      });

      // Adjust the aspect ratio. crop/pad are deterministic (the model never
      // invents content); 'ai' outpaints — the model extends the scene to fill
      // the new frame with a second generation call.
      const ratioValue = aspectRatioValue(aspectRatio);
      const framed =
        aspectFit === 'ai'
          ? await expandWithAi({
              buffer: result.buffer,
              mime: result.mime,
              ratio: ratioValue,
              generate: (buf, m, prompt) =>
                generateStaging({ imageBuffer: buf, mime: m, prompt, imageConfig }),
            })
          : await reframe({
              buffer: result.buffer,
              mime: result.mime,
              ratio: ratioValue,
              fit: aspectFit,
            });

      const outExt = extForMime(framed.mime);
      const output = await saveBuffer(framed.buffer, outExt, 'out');
      const processingMs = Date.now() - started;

      await StagingJob.create({
        input_image_url: input.url,
        output_image_url: output.url,
        mode,
        selections,
        extra_prompt: extraPrompt,
        composed_prompt: composedPrompt,
        aspect_ratio: aspectRatio,
        aspect_fit: aspectFit,
        image_size: imageSize,
        model: result.model,
        processing_ms: processingMs,
        status: 'done',
      });

      return {
        result_image_url: output.url,
        composed_prompt: composedPrompt,
        mode,
        aspect_ratio: aspectRatio,
        aspect_fit: aspectFit,
        image_size: imageSize,
        model: result.model,
        processing_ms: processingMs,
      };
    } catch (err) {
      await StagingJob.create({
        input_image_url: input.url,
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

      if (err instanceof ProviderError) {
        request.log.error({ err: err.cause ?? err }, 'provider failure');
        return reply.code(502).send({ error: 'image provider failed' });
      }
      throw err;
    }
  });
}
