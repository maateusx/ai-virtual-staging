// Output format presets for the staged image.
//
// Aspect ratio and resolution are passed to the Gemini image model via
// `config.imageConfig` ({ aspectRatio, imageSize }). Unlike the open-ended
// StagingParameter prompt-fragments, these are a finite, validated set of API
// config values, so they live here as a curated list rather than in the DB.
//
// Supported aspectRatio values per the Gemini API: 1:1, 2:3, 3:2, 3:4, 4:3,
// 9:16, 16:9, 21:9. Supported imageSize values: 1K, 2K, 4K.

// `value` is what gets sent to the API; `original` keeps the input aspect ratio
// (no aspectRatio sent → the model preserves the source proportions).
export const ASPECT_RATIOS = [
  { id: 'original', label: 'Original (preservar entrada)', value: null },
  { id: '16:9', label: 'Paisagem 16:9', value: '16:9' },
  { id: '1:1', label: 'Quadrado 1:1', value: '1:1' },
  { id: '3:4', label: 'Vertical 3:4', value: '3:4' },
  { id: '9:16', label: 'Story 9:16', value: '9:16' },
  { id: '4:3', label: 'Clássico 4:3', value: '4:3' },
];

// Default to the input proportions: forcing a different ratio makes the model
// re-crop/re-frame the photo, which shifts the apparent camera angle and
// geometry — the opposite of what a structure-preserving edit needs.
export const DEFAULT_ASPECT_RATIO = 'original';

export const IMAGE_SIZES = [
  { id: '1K', label: '1K (padrão)' },
  { id: '2K', label: '2K' },
  { id: '4K', label: '4K' },
];

export const DEFAULT_IMAGE_SIZE = '1K';

// How to reach a non-source aspect ratio.
//   crop / pad – applied deterministically with sharp after generation
//                (see services/reframe.js); the model never invents content.
//   ai          – outpaint: the image model (Nano Banana) extends the scene to
//                 fill the new frame, generating realistic surroundings instead
//                 of cropping or adding bars (see reframe.js expandWithAi).
export const ASPECT_FITS = [
  { id: 'crop', label: 'Cortar bordas' },
  { id: 'pad', label: 'Adicionar barras' },
  { id: 'ai', label: 'Expandir com IA' },
];

export const DEFAULT_ASPECT_FIT = 'crop';

const ASPECT_RATIO_BY_ID = new Map(ASPECT_RATIOS.map((a) => [a.id, a]));
const IMAGE_SIZE_IDS = new Set(IMAGE_SIZES.map((s) => s.id));
const ASPECT_FIT_IDS = new Set(ASPECT_FITS.map((f) => f.id));

export function isValidAspectRatio(id) {
  return ASPECT_RATIO_BY_ID.has(id);
}

export function isValidImageSize(id) {
  return IMAGE_SIZE_IDS.has(id);
}

export function isValidAspectFit(id) {
  return ASPECT_FIT_IDS.has(id);
}

// Target ratio string ("16:9") for a preset id, or null for the original ratio.
export function aspectRatioValue(id) {
  return ASPECT_RATIO_BY_ID.get(id)?.value ?? null;
}

/**
 * Build the Gemini `imageConfig` object. Only the resolution (imageSize) is sent
 * to the model — the aspect ratio is handled by us post-generation (reframe.js),
 * because asking the model for a new ratio makes it hallucinate.
 * Returns `undefined` when there's nothing to send.
 * @param {Object} args
 * @param {string} args.imageSizeId
 * @returns {{ imageSize?: string } | undefined}
 */
export function resolveImageConfig({ imageSizeId }) {
  const imageConfig = {};

  if (imageSizeId && imageSizeId !== '1K') imageConfig.imageSize = imageSizeId;

  return Object.keys(imageConfig).length > 0 ? imageConfig : undefined;
}

// Public-facing presets for GET /v1/staging/config (no internal `value`).
export function publicOutputConfig() {
  return {
    aspect_ratios: ASPECT_RATIOS.map(({ id, label }) => ({ id, label })),
    default_aspect_ratio: DEFAULT_ASPECT_RATIO,
    image_sizes: IMAGE_SIZES,
    default_image_size: DEFAULT_IMAGE_SIZE,
    aspect_fits: ASPECT_FITS,
    default_aspect_fit: DEFAULT_ASPECT_FIT,
  };
}
