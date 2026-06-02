// Image-to-image provider abstraction.
//
// Real mode: calls Google's Gemini image model (a.k.a. "Nano Banana",
// gemini-2.5-flash-image) directly via @google/genai. The input image is sent
// inline (base64) together with the composed prompt; the edited image comes
// back inline in the response parts.
//
// Mock mode (no GEMINI_API_KEY): returns the original image buffer unchanged,
// so the whole flow is runnable locally without credentials.

import { env } from '../config/env.js';

class ProviderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ProviderError';
    this.cause = cause;
  }
}

export { ProviderError };

let _genai = null;
async function getClient() {
  if (_genai) return _genai;
  const { GoogleGenAI } = await import('@google/genai');
  _genai = new GoogleGenAI({ apiKey: env.gemini.key });
  return _genai;
}

/**
 * Generate a staged image from an empty-room photo.
 * @param {Object} args
 * @param {Buffer} args.imageBuffer  raw input image bytes
 * @param {string} args.mime         input mime type
 * @param {string} args.prompt       composed instruction
 * @returns {Promise<{ buffer: Buffer, mime: string, model: string }>}
 */
export async function generateStaging({ imageBuffer, mime, prompt }) {
  if (!env.gemini.enabled) {
    // Mock: echo the input image back.
    return { buffer: imageBuffer, mime, model: 'mock' };
  }

  try {
    const ai = await getClient();

    const response = await ai.models.generateContent({
      model: env.gemini.model,
      contents: [
        { text: prompt },
        { inlineData: { mimeType: mime, data: imageBuffer.toString('base64') } },
      ],
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

    return { buffer, mime: outMime, model: env.gemini.model };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError('Image provider call failed', err);
  }
}
