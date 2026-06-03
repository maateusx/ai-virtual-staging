// Aspect-ratio adjustment.
//
// By default the model generates at the original proportions and any ratio
// change is a pure, deterministic pixel operation done here with sharp:
//   crop – center-crop to the target ratio (keeps real pixels, loses edges)
//   pad  – letterbox with a solid background (keeps the whole image, adds bars)
//
// The `ai` fit is different: instead of cropping or padding, we ask the image
// model to outpaint — extend the scene to fill the new frame (see expandWithAi).
// This is opt-in because outpainting invents new content around the photo.

import sharp from 'sharp';

const PAD_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

// Compute sharp `extend` margins that grow `w`×`h` to `targetRatio`, centering
// the original. Returns null when no growth is needed for that ratio.
function extendToRatio(w, h, sourceRatio, targetRatio) {
  if (targetRatio > sourceRatio) {
    const dx = Math.round(h * targetRatio) - w;
    const left = Math.floor(dx / 2);
    return { top: 0, bottom: 0, left, right: dx - left };
  }
  const dy = Math.round(w / targetRatio) - h;
  const top = Math.floor(dy / 2);
  return { top, bottom: dy - top, left: 0, right: 0 };
}

// Re-encode in the same format the model returned.
function encode(pipeline, mime) {
  if (mime === 'image/png') return pipeline.png();
  if (mime === 'image/webp') return pipeline.webp();
  return pipeline.jpeg({ quality: 90 });
}

/**
 * @param {Object} args
 * @param {Buffer} args.buffer  source image bytes (model output)
 * @param {string} args.mime    image mime type
 * @param {string|null} args.ratio  target ratio as "aw:ah" (null/'' = no change)
 * @param {'crop'|'pad'} [args.fit]  how to reach the ratio (default crop)
 * @returns {Promise<{ buffer: Buffer, mime: string }>}
 */
export async function reframe({ buffer, mime, ratio, fit = 'crop' }) {
  if (!ratio) return { buffer, mime };

  const [aw, ah] = ratio.split(':').map(Number);
  if (!aw || !ah) return { buffer, mime };
  const targetRatio = aw / ah;

  const meta = await sharp(buffer).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) return { buffer, mime };

  const sourceRatio = w / h;
  // Already the target ratio (within rounding tolerance) → nothing to do.
  if (Math.abs(sourceRatio - targetRatio) < 0.01) return { buffer, mime };

  if (fit === 'pad') {
    // Extend the shorter axis with bars to reach the target ratio.
    const extend = extendToRatio(w, h, sourceRatio, targetRatio);
    const out = await encode(
      sharp(buffer).extend({ ...extend, background: PAD_BACKGROUND }),
      mime
    ).toBuffer();
    return { buffer: out, mime };
  }

  // crop: center-extract the largest target-ratio rectangle (no upscaling).
  let cw;
  let ch;
  if (targetRatio > sourceRatio) {
    cw = w;
    ch = Math.round(w / targetRatio);
  } else {
    ch = h;
    cw = Math.round(h * targetRatio);
  }
  const left = Math.floor((w - cw) / 2);
  const top = Math.floor((h - ch) / 2);
  const out = await encode(
    sharp(buffer).extract({ left, top, width: cw, height: ch }),
    mime
  ).toBuffer();
  return { buffer: out, mime };
}

// Outpaint prompt: the model receives the photo centered on a larger white
// canvas and must fill ONLY the white margins, extending the scene seamlessly.
const OUTPAINT_PROMPT =
  'Outpaint this photograph to fill the entire frame. The original photo is ' +
  'centered on a larger canvas with solid white margins. Replace only those ' +
  'white margins with a seamless, photorealistic continuation of the existing ' +
  'scene — naturally extend the walls, floor, ceiling, windows and surroundings ' +
  'beyond the original edges. Do not modify, move, rescale, crop or redraw ' +
  'anything inside the original photo area: keep those pixels exactly as they ' +
  'are. Generate new content only in the white margin region, matching the ' +
  'perspective, vanishing points, lighting, color temperature, materials and ' +
  'style perfectly across the seam, with no visible border. Photorealistic.';

/**
 * Reach a non-source aspect ratio by outpainting with the image model instead
 * of cropping/padding. Builds a target-ratio canvas with the photo centered on
 * white margins, asks the model to fill those margins, then enforces the exact
 * ratio deterministically as a safety net (the model may drift a few pixels).
 *
 * @param {Object} args
 * @param {Buffer} args.buffer  source image bytes (model output at source ratio)
 * @param {string} args.mime    image mime type
 * @param {string|null} args.ratio  target ratio as "aw:ah" (null/'' = no change)
 * @param {(buffer: Buffer, mime: string, prompt: string) =>
 *          Promise<{ buffer: Buffer, mime: string }>} args.generate
 *   image-model call (injected so this module stays provider-agnostic)
 * @returns {Promise<{ buffer: Buffer, mime: string }>}
 */
export async function expandWithAi({ buffer, mime, ratio, generate }) {
  if (!ratio) return { buffer, mime };

  const [aw, ah] = ratio.split(':').map(Number);
  if (!aw || !ah) return { buffer, mime };
  const targetRatio = aw / ah;

  const meta = await sharp(buffer).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) return { buffer, mime };

  const sourceRatio = w / h;
  // Already the target ratio (within rounding tolerance) → nothing to do.
  if (Math.abs(sourceRatio - targetRatio) < 0.01) return { buffer, mime };

  // Photo centered on white margins at the target ratio. PNG keeps the original
  // pixels lossless so the model has a clean reference to extend from.
  const extend = extendToRatio(w, h, sourceRatio, targetRatio);
  const canvas = await sharp(buffer)
    .extend({ ...extend, background: PAD_BACKGROUND })
    .png()
    .toBuffer();

  const expanded = await generate(canvas, 'image/png', OUTPAINT_PROMPT);

  // Enforce the exact ratio in case the model returned slightly off dimensions.
  return reframe({ buffer: expanded.buffer, mime: expanded.mime, ratio, fit: 'crop' });
}
