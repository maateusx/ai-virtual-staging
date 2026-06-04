// Image-to-image provider abstraction.
//
// Calls Google's Gemini image model (a.k.a. "Nano Banana",
// gemini-2.5-flash-image) directly via @google/genai. The input image is sent
// inline (base64) together with the composed prompt; the edited image comes
// back inline in the response parts.
//
// A key is required: the caller may supply their own (BYOK), otherwise the
// server key is used. When neither exists, MissingApiKeyError is thrown.

import { env } from '../config/env.js';

class ProviderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ProviderError';
    this.cause = cause;
  }
}

// Thrown when no Gemini key is available (caller-supplied or server). This is a
// client-fixable condition, so the route maps it to a 4xx rather than a 502.
class MissingApiKeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingApiKeyError';
  }
}

export { ProviderError, MissingApiKeyError };

let _genai = null;
async function getClient(apiKey) {
  const { GoogleGenAI } = await import('@google/genai');
  // A user-supplied key builds a throwaway client (never cached, so one user's
  // key can't leak into another request). The server key is cached.
  if (apiKey) return new GoogleGenAI({ apiKey });
  if (_genai) return _genai;
  _genai = new GoogleGenAI({ apiKey: env.gemini.key });
  return _genai;
}

/**
 * Generate a staged image from an empty-room photo.
 * @param {Object} args
 * @param {Buffer} args.imageBuffer  raw input image bytes
 * @param {string} args.mime         input mime type
 * @param {string} args.prompt       composed instruction
 * @param {Buffer} [args.maskBuffer]  optional black/white mask sent as a second
 *   image (white = region to edit). Used by the localized-edit (inpaint) flow.
 * @param {string} [args.maskMime]   mask mime type (defaults to image/png)
 * @param {{ aspectRatio?: string, imageSize?: string }} [args.imageConfig]
 *   optional Gemini output controls (aspect ratio / resolution)
 * @param {string} [args.apiKey]  caller-supplied Gemini key (BYOK); when present
 *   it takes precedence over the server key
 * @returns {Promise<{ buffer: Buffer, mime: string, model: string,
 *   usage: ({ promptTokens: number, outputTokens: number, totalTokens: number }|null) }>}
 */
export async function generateStaging({
  imageBuffer,
  mime,
  prompt,
  maskBuffer,
  maskMime,
  imageConfig,
  apiKey,
}) {
  const userKey = apiKey?.trim();
  if (!userKey && !env.gemini.enabled) {
    throw new MissingApiKeyError('No Gemini API key available');
  }

  try {
    const ai = await getClient(userKey);

    // The photo comes first; an optional mask follows as a second image so the
    // model knows which region the prompt's edit applies to.
    const contents = [
      { text: prompt },
      { inlineData: { mimeType: mime, data: imageBuffer.toString('base64') } },
    ];
    if (maskBuffer) {
      contents.push({
        inlineData: { mimeType: maskMime || 'image/png', data: maskBuffer.toString('base64') },
      });
    }

    const response = await ai.models.generateContent({
      model: env.gemini.model,
      contents,
      ...(imageConfig ? { config: { imageConfig } } : {}),
    });

    // Find the first image part in the response.
    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart) {
      // Surface any text the model returned (e.g. a safety refusal).
      const text = parts.find((p) => p.text)?.text;
      throw new ProviderError(
        text ? `Model returned no image: ${text}` : 'Model returned no image'
      );
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const outMime = imagePart.inlineData.mimeType || 'image/png';

    // Token usage (includes image tokens). May be absent on some responses.
    const u = response?.usageMetadata;
    const usage = u
      ? {
          promptTokens: u.promptTokenCount ?? 0,
          outputTokens: u.candidatesTokenCount ?? 0,
          totalTokens: u.totalTokenCount ?? 0,
        }
      : null;

    return { buffer, mime: outMime, model: env.gemini.model, usage };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError('Image provider call failed', err);
  }
}
