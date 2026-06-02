// Local-disk storage abstraction. Images are written under server/uploads and
// served statically by Fastify; a public (temporary) URL is returned.
// Swap this module for an S3-backed implementation later — the interface is
// just `saveBuffer(buffer, ext, dir)` and `publicUrl(relPath)`.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function extForMime(mime) {
  return EXT_BY_MIME[mime] ?? 'jpg';
}

/**
 * Persist a buffer under uploads/<dir> and return its public URL + paths.
 * @param {Buffer} buffer
 * @param {string} ext   file extension without dot (e.g. "jpg")
 * @param {'in'|'out'} dir
 */
export async function saveBuffer(buffer, ext, dir) {
  const filename = `${nanoid(16)}.${ext}`;
  const relPath = `${dir}/${filename}`;
  const absPath = path.join(UPLOADS_ROOT, dir, filename);
  await writeFile(absPath, buffer);
  return { relPath, absPath, url: publicUrl(relPath) };
}

export function publicUrl(relPath) {
  return `${env.publicBaseUrl}/uploads/${relPath}`;
}
