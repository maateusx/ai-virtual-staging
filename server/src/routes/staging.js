import { StagingParameter } from '../models/StagingParameter.js';
import { StagingJob } from '../models/StagingJob.js';
import { composePrompt } from '../services/promptBuilder.js';
import { generateStaging, ProviderError } from '../services/imageProvider.js';
import { saveBuffer, extForMime } from '../services/storage.js';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export async function stagingRoutes(app) {
  // --- 5.1 Public config (no prompt_fragment exposed) -----------------------
  app.get('/v1/staging/config', async () => {
    const params = await StagingParameter.find({ active: true }).sort({ order: 1 });
    return { parameters: params.map((p) => p.toPublic()) };
  });

  // --- 5.2 Process image (synchronous) --------------------------------------
  app.post('/v1/staging', async (request, reply) => {
    const started = Date.now();

    // Parse multipart: one image file + text fields.
    let imageBuffer = null;
    let imageMime = null;
    let selectionsRaw = null;
    let extraPrompt = '';

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

    // Persist input image.
    const inExt = extForMime(imageMime);
    const input = await saveBuffer(imageBuffer, inExt, 'in');

    // Resolve fragments + compose prompt.
    const parameters = await StagingParameter.find({ active: true }).sort({ order: 1 });
    const { composedPrompt } = composePrompt(parameters, selections, extraPrompt);

    try {
      const result = await generateStaging({
        imageBuffer,
        mime: imageMime,
        prompt: composedPrompt,
      });

      const outExt = extForMime(result.mime);
      const output = await saveBuffer(result.buffer, outExt, 'out');
      const processingMs = Date.now() - started;

      await StagingJob.create({
        input_image_url: input.url,
        output_image_url: output.url,
        selections,
        extra_prompt: extraPrompt,
        composed_prompt: composedPrompt,
        model: result.model,
        processing_ms: processingMs,
        status: 'done',
      });

      return {
        result_image_url: output.url,
        composed_prompt: composedPrompt,
        model: result.model,
        processing_ms: processingMs,
      };
    } catch (err) {
      await StagingJob.create({
        input_image_url: input.url,
        selections,
        extra_prompt: extraPrompt,
        composed_prompt: composedPrompt,
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
