// Local watermark compositing.
//
// Stamps a user-supplied PNG over the staged output with sharp — a pure pixel
// operation, no model call, so it adds zero token cost. The watermark is scaled
// to a fraction of the base image width (preserving its aspect ratio) and placed
// at one of nine positions: a vertical band (top/middle/bottom) crossed with a
// horizontal band (left/center/right). Corner/edge placements get a small margin
// so the mark isn't flush against the border; centered placements ignore it.
//
// Two optional adjustments run locally before compositing:
//   • color  – recolor the mark to a flat colour, preserving its alpha shape
//   • opacity – scale the mark's alpha down so it reads as a subtle overlay

import sharp from 'sharp';

export const WATERMARK_VERTICALS = ['top', 'middle', 'bottom'];
export const WATERMARK_HORIZONTALS = ['left', 'center', 'right'];

export const DEFAULT_WATERMARK_VERTICAL = 'bottom';
export const DEFAULT_WATERMARK_HORIZONTAL = 'right';
export const DEFAULT_WATERMARK_SIZE = 20; // % of base image width
export const MIN_WATERMARK_SIZE = 2;
export const MAX_WATERMARK_SIZE = 80;

export const DEFAULT_WATERMARK_OPACITY = 100; // %
export const MIN_WATERMARK_OPACITY = 5;
export const MAX_WATERMARK_OPACITY = 100;

// Edge padding for non-centered placements, as a fraction of base width.
const MARGIN_RATIO = 0.025;

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function isValidWatermarkVertical(v) {
  return WATERMARK_VERTICALS.includes(v);
}

export function isValidWatermarkHorizontal(h) {
  return WATERMARK_HORIZONTALS.includes(h);
}

export function isValidWatermarkSize(size) {
  return Number.isFinite(size) && size >= MIN_WATERMARK_SIZE && size <= MAX_WATERMARK_SIZE;
}

export function isValidWatermarkOpacity(opacity) {
  return (
    Number.isFinite(opacity) && opacity >= MIN_WATERMARK_OPACITY && opacity <= MAX_WATERMARK_OPACITY
  );
}

export function isValidWatermarkColor(color) {
  return typeof color === 'string' && HEX_RE.test(color.trim());
}

function hexToRgb(hex) {
  const h = hex.trim().replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Re-encode in the same format the staged image used (mirrors reframe.js).
function encode(pipeline, mime) {
  if (mime === 'image/png') return pipeline.png();
  if (mime === 'image/webp') return pipeline.webp();
  return pipeline.jpeg({ quality: 90 });
}

/**
 * Composite a PNG watermark over a base image.
 *
 * @param {Object} args
 * @param {Buffer} args.buffer           base (staged) image bytes
 * @param {string} args.mime             base image mime type
 * @param {Buffer} args.watermarkBuffer  watermark PNG bytes (alpha respected)
 * @param {'top'|'middle'|'bottom'} args.vertical
 * @param {'left'|'center'|'right'} args.horizontal
 * @param {number} args.size             watermark width as % of base width
 * @param {number} [args.opacity]        watermark opacity as % (5..100)
 * @param {string|null} [args.color]     hex colour to recolor the mark (e.g. "#ffffff")
 * @returns {Promise<{ buffer: Buffer, mime: string }>}
 */
export async function applyWatermark({
  buffer,
  mime,
  watermarkBuffer,
  vertical = DEFAULT_WATERMARK_VERTICAL,
  horizontal = DEFAULT_WATERMARK_HORIZONTAL,
  size = DEFAULT_WATERMARK_SIZE,
  opacity = DEFAULT_WATERMARK_OPACITY,
  color = null,
}) {
  const base = sharp(buffer);
  const meta = await base.metadata();
  const bw = meta.width;
  const bh = meta.height;
  if (!bw || !bh) return { buffer, mime };

  // Scale the watermark to the requested fraction of the base width, capped so
  // it never exceeds the base in either dimension. ensureAlpha so the recolor /
  // opacity passes always have an alpha channel to operate on.
  const pct = Math.min(MAX_WATERMARK_SIZE, Math.max(MIN_WATERMARK_SIZE, size)) / 100;
  const targetW = Math.max(1, Math.round(bw * pct));
  let wmBuffer = await sharp(watermarkBuffer)
    .resize({ width: Math.min(targetW, bw), height: bh, fit: 'inside', withoutEnlargement: false })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Color filter: replace the mark's RGB with a flat colour while keeping its
  // alpha shape (anti-aliased edges included). 'in' = source-in, so the solid
  // colour tile is clipped to the watermark's alpha.
  if (color && isValidWatermarkColor(color)) {
    const { r, g, b } = hexToRgb(color);
    wmBuffer = await sharp(wmBuffer)
      .composite([
        {
          input: { create: { width: 1, height: 1, channels: 4, background: { r, g, b, alpha: 1 } } },
          tile: true,
          blend: 'in',
        },
      ])
      .png()
      .toBuffer();
  }

  // Opacity: multiply the mark's alpha by the factor. 'dest-in' keeps the
  // watermark's RGB and scales its alpha by the uniform tile's alpha.
  const op = Math.min(MAX_WATERMARK_OPACITY, Math.max(MIN_WATERMARK_OPACITY, opacity));
  if (op < 100) {
    wmBuffer = await sharp(wmBuffer)
      .composite([
        {
          input: {
            create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: op / 100 } },
          },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();
  }

  const wmMeta = await sharp(wmBuffer).metadata();
  const ww = wmMeta.width;
  const wh = wmMeta.height;

  const margin = Math.round(bw * MARGIN_RATIO);

  let left;
  if (horizontal === 'left') left = margin;
  else if (horizontal === 'right') left = bw - ww - margin;
  else left = Math.round((bw - ww) / 2);

  let top;
  if (vertical === 'top') top = margin;
  else if (vertical === 'bottom') top = bh - wh - margin;
  else top = Math.round((bh - wh) / 2);

  // Keep the watermark fully on-canvas regardless of size/margin rounding.
  left = Math.min(Math.max(0, left), Math.max(0, bw - ww));
  top = Math.min(Math.max(0, top), Math.max(0, bh - wh));

  const out = await encode(base.composite([{ input: wmBuffer, top, left }]), mime).toBuffer();
  return { buffer: out, mime };
}
