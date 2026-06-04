// Gemini (Veo) image-to-video provider.
//
// Implements the provider contract used by videoProvider.js — a three-phase
// flow because Veo is a long-running operation:
//   start(args)  -> { operationName, operation }   kick off generation
//   poll(args)   -> { done, operation, errorMessage }   check progress
//   download(args) -> { buffer, mime }              pull the finished MP4
//
// Mirrors imageProvider.js conventions: lazy getClient() that caches the server
// client and builds a throwaway client for a user-supplied key (BYOK), so one
// user's key can't leak into another request.

import { env } from '../../../config/env.js';
import { ProviderError, MissingApiKeyError } from '../errors.js';

let _genai = null;
async function getClient(apiKey) {
  const { GoogleGenAI } = await import('@google/genai');
  if (apiKey) return new GoogleGenAI({ apiKey }); // throwaway BYOK client
  if (_genai) return _genai;
  _genai = new GoogleGenAI({ apiKey: env.gemini.key });
  return _genai;
}

/**
 * Start a video generation. Returns a serializable operation name (durable, used
 * to resume polling) plus the live operation object (kept in memory for fast
 * polling within this process).
 */
async function start({
  imageBuffer,
  mime,
  prompt,
  model,
  aspectRatio,
  resolution,
  durationSeconds,
  audio,
  apiKey,
}) {
  const userKey = apiKey?.trim();
  if (!userKey && !env.gemini.enabled) {
    throw new MissingApiKeyError('No Gemini API key available');
  }
  try {
    const ai = await getClient(userKey);
    const operation = await ai.models.generateVideos({
      model,
      prompt: prompt || undefined,
      image: { imageBytes: imageBuffer.toString('base64'), mimeType: mime },
      config: {
        aspectRatio,
        resolution,
        durationSeconds,
        numberOfVideos: 1,
        // NOTE: do not pass `generateAudio`. The Gemini Developer API rejects it
        // outright (the SDK throws "generateAudio parameter is not supported in
        // Gemini API." for any value, even false) — it's a Vertex-only toggle.
        // Veo 3 emits audio by default; Veo 2 has none. The `audio` arg is kept
        // for the provider contract but intentionally unused here.
        personGeneration: 'allow_adult',
      },
    });
    return { operationName: operation.name, operation };
  } catch (err) {
    throw new ProviderError('Video provider start failed', err);
  }
}

/**
 * Poll a running operation. Reconstructs from `operationName` when the live
 * object is gone (e.g. after a server restart). Returns errorMessage when the
 * operation finished with a provider-side error.
 */
async function poll({ operationName, operation, apiKey }) {
  try {
    const ai = await getClient(apiKey?.trim());
    const op = await ai.operations.getVideosOperation({
      operation: operation ?? { name: operationName },
    });
    if (op.error) {
      return { done: true, operation: op, errorMessage: op.error.message || 'generation failed' };
    }
    return { done: !!op.done, operation: op, errorMessage: null };
  } catch (err) {
    throw new ProviderError('Video provider poll failed', err);
  }
}

/**
 * Download the finished MP4 into a Buffer. Google purges generated videos after
 * ~2 days, so the caller persists it immediately. Prefers inline bytes when the
 * SDK provides them; otherwise downloads the File handle to an OS temp file,
 * reads it, and unlinks.
 */
async function download({ operation, apiKey }) {
  try {
    const ai = await getClient(apiKey?.trim());
    const generated = operation?.response?.generatedVideos?.[0];
    if (!generated?.video) {
      throw new ProviderError('Operation done but no video in response');
    }
    const video = generated.video;

    // Preferred: inline bytes (no disk round-trip).
    if (video.videoBytes) {
      return { buffer: Buffer.from(video.videoBytes, 'base64'), mime: 'video/mp4' };
    }

    // Fallback: download the File handle to a temp path, read, then clean up.
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { readFile, unlink } = await import('node:fs/promises');
    const { randomUUID } = await import('node:crypto');
    const tmpPath = join(tmpdir(), `veo-${randomUUID()}.mp4`);
    await ai.files.download({ file: video, downloadPath: tmpPath });
    const buffer = await readFile(tmpPath);
    await unlink(tmpPath).catch(() => {});
    return { buffer, mime: 'video/mp4' };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError('Video provider download failed', err);
  }
}

export const geminiVideoProvider = { id: 'gemini', start, poll, download };
