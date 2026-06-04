// Video model registry — the single source of truth for which image-to-video
// models exist, their constraints, and their pricing. Pure data, fully
// serializable to the frontend (no secrets).
//
// Each model is owned by a `provider` (e.g. 'gemini'); the videoProvider façade
// resolves model -> provider through this registry. Adding a new provider's
// model later is just another entry here with its own `provider` id — no route
// or pricing changes needed.
//
// NOTE: the Veo 3.1 models are `preview`; Google may change ids, limits and
// pricing without much notice. Re-check ai.google.dev before launch.

export const VIDEO_MODELS = {
  'veo-3.1-generate-preview': {
    label: 'Veo 3.1',
    provider: 'gemini',
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    supportsAudio: true,
    // USD per second of output, by resolution.
    pricePerSecondUsd: { '720p': 0.4, '1080p': 0.4 },
    defaults: { aspectRatio: '16:9', resolution: '720p', duration: 8 },
  },
  'veo-3.1-fast-generate-preview': {
    label: 'Veo 3.1 Fast',
    provider: 'gemini',
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    supportsAudio: true,
    pricePerSecondUsd: { '720p': 0.1, '1080p': 0.12 },
    defaults: { aspectRatio: '16:9', resolution: '720p', duration: 8 },
  },
  'veo-3.1-lite-generate-preview': {
    label: 'Veo 3.1 Lite',
    provider: 'gemini',
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    durations: [4, 6, 8],
    supportsAudio: true,
    pricePerSecondUsd: { '720p': 0.05, '1080p': 0.08 },
    defaults: { aspectRatio: '16:9', resolution: '720p', duration: 8 },
  },
  'veo-2.0-generate-001': {
    label: 'Veo 2',
    provider: 'gemini',
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p'], // 720p only
    durations: [5, 6, 7, 8], // Veo 2 is 5–8s
    supportsAudio: false, // no native audio
    pricePerSecondUsd: { '720p': 0.35 },
    defaults: { aspectRatio: '16:9', resolution: '720p', duration: 6 },
  },
};

export const DEFAULT_VIDEO_MODEL = 'veo-3.1-fast-generate-preview';

export function getModelDescriptor(modelId) {
  return VIDEO_MODELS[modelId] ?? null;
}

// Public payload for /v1/video/config — reshaped into the arrays/snake_case the
// UI iterates over. Contains no secrets.
export function publicVideoConfig() {
  return {
    models: Object.entries(VIDEO_MODELS).map(([id, m]) => ({
      id,
      label: m.label,
      provider: m.provider,
      aspect_ratios: m.aspectRatios,
      resolutions: m.resolutions,
      durations: m.durations,
      supports_audio: m.supportsAudio,
      price_per_second_usd: m.pricePerSecondUsd,
      defaults: {
        aspect_ratio: m.defaults.aspectRatio,
        resolution: m.defaults.resolution,
        duration: m.defaults.duration,
      },
    })),
    default_model: DEFAULT_VIDEO_MODEL,
  };
}

/**
 * Validate a request against the chosen model's constraints.
 * @returns {string|null} an error message, or null when valid.
 */
export function validateVideoParams({ model, aspectRatio, resolution, duration, audio }) {
  const d = getModelDescriptor(model);
  if (!d) return `invalid model: ${model}`;
  if (!d.aspectRatios.includes(aspectRatio)) {
    return `model ${model} does not support aspect_ratio ${aspectRatio}`;
  }
  if (!d.resolutions.includes(resolution)) {
    return `model ${model} does not support resolution ${resolution}`;
  }
  if (!d.durations.includes(duration)) {
    return `model ${model} does not support duration ${duration}s`;
  }
  if (audio && !d.supportsAudio) {
    return `model ${model} does not support audio`;
  }
  return null;
}
