// Localized-edit compositing ("paste-back").
//
// The image model is asked to edit only the masked region, but it tends to
// subtly re-render the entire frame (and may return slightly different
// dimensions). To guarantee that everything OUTSIDE the painted region stays
// pixel-for-pixel identical to the original, we composite the model's output
// back over the original using the mask as an alpha channel: original pixels
// win where the mask is black, the edited pixels win where it is white. The
// mask edge is feathered a few pixels so the seam is invisible.

import sharp from 'sharp';

/**
 * @param {Object} args
 * @param {Buffer} args.originalBuffer  the user's original photo bytes
 * @param {Buffer} args.editedBuffer    the model's edited output bytes
 * @param {Buffer} args.maskBuffer      black/white mask (white = edited region)
 * @returns {Promise<{ buffer: Buffer, mime: string }>}
 */
export async function compositeEdit({ originalBuffer, editedBuffer, maskBuffer }) {
  const meta = await sharp(originalBuffer).metadata();
  const W = meta.width;
  const H = meta.height;
  if (!W || !H) {
    // Can't determine dimensions — fall back to the raw model output.
    return { buffer: editedBuffer, mime: 'image/jpeg' };
  }

  // Feather radius scales with image size so the blend looks consistent.
  const feather = Math.max(1, Math.round(Math.min(W, H) * 0.004));

  // Edited output, resized to the original dimensions, as flat RGB.
  const editedRgb = await sharp(editedBuffer)
    .resize(W, H, { fit: 'fill' })
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer();

  // Mask → single-channel alpha at WxH, blurred for a soft edge.
  const alpha = await sharp(maskBuffer)
    .resize(W, H, { fit: 'fill' })
    .grayscale()
    .blur(feather)
    .toColourspace('b-w')
    .raw()
    .toBuffer();

  // Attach the mask as the alpha channel of the edited image, then lay it over
  // the untouched original.
  const editedWithAlpha = await sharp(editedRgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } })
    .png()
    .toBuffer();

  const out = await sharp(originalBuffer)
    .removeAlpha()
    .composite([{ input: editedWithAlpha, blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return { buffer: out, mime: 'image/jpeg' };
}
