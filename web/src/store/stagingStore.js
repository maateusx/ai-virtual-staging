import { create } from 'zustand';
import { api } from '@/lib/api';

// User's own Gemini key is kept in localStorage so they don't re-paste it
// every session. It is sent per-request and never stored server-side.
const API_KEY_STORAGE = 'decorar:gemini_api_key';
const loadApiKey = () => {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
};

// State for the processing (staging) screen.
export const useStagingStore = create((set, get) => ({
  parameters: [],
  outputConfig: null, // { aspect_ratios, default_aspect_ratio, image_sizes, default_image_size }
  modes: [], // [{ id, label }]
  serverHasKey: true, // does the backend have its own Gemini key? (BYOK required when false)
  loadingConfig: false,

  imageFile: null,
  imagePreview: null,
  mode: 'furnish', // furnish | empty | declutter
  selections: {}, // parameterId -> optionId | [optionId]
  extraPrompt: '',
  aspectRatio: null,
  aspectFit: null,
  imageSize: null,
  variations: 1, // how many options to generate per request (1..4)
  apiKey: loadApiKey(),

  processing: false,
  result: null, // { result_image_url, composed_prompt, model, processing_ms }
  error: null,

  loadConfig: async () => {
    set({ loadingConfig: true, error: null });
    try {
      const { parameters, output, modes, default_mode, server_has_key } =
        await api.getConfig();
      set((s) => ({
        parameters,
        outputConfig: output,
        modes: modes ?? [],
        serverHasKey: server_has_key ?? true,
        // Initialise selectors from backend defaults (don't clobber user choice).
        mode: s.mode ?? default_mode ?? 'furnish',
        aspectRatio: s.aspectRatio ?? output?.default_aspect_ratio ?? null,
        aspectFit: s.aspectFit ?? output?.default_aspect_fit ?? null,
        imageSize: s.imageSize ?? output?.default_image_size ?? null,
      }));
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loadingConfig: false });
    }
  },

  setImage: (file) => {
    const prev = get().imagePreview;
    if (prev) URL.revokeObjectURL(prev);
    set({
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : null,
      result: null,
      error: null,
    });
  },

  setMode: (mode) => set({ mode }),

  setSelection: (parameterId, value) =>
    set((s) => ({ selections: { ...s.selections, [parameterId]: value } })),

  setExtraPrompt: (extraPrompt) => set({ extraPrompt }),

  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setAspectFit: (aspectFit) => set({ aspectFit }),
  setImageSize: (imageSize) => set({ imageSize }),
  setVariations: (variations) => set({ variations }),

  setApiKey: (apiKey) => {
    try {
      if (apiKey) localStorage.setItem(API_KEY_STORAGE, apiKey);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    set({ apiKey });
  },

  reset: () => {
    const prev = get().imagePreview;
    if (prev) URL.revokeObjectURL(prev);
    const { outputConfig } = get();
    set({
      imageFile: null,
      imagePreview: null,
      selections: {},
      extraPrompt: '',
      aspectRatio: outputConfig?.default_aspect_ratio ?? null,
      aspectFit: outputConfig?.default_aspect_fit ?? null,
      imageSize: outputConfig?.default_image_size ?? null,
      result: null,
      error: null,
    });
  },

  process: async () => {
    const {
      imageFile,
      mode,
      selections,
      extraPrompt,
      aspectRatio,
      aspectFit,
      imageSize,
      apiKey,
      variations,
    } = get();
    if (!imageFile) {
      set({ error: 'Envie uma imagem primeiro.' });
      return;
    }
    // Style selections only apply when furnishing.
    set({ processing: true, error: null, result: null });
    try {
      const result = await api.process({
        image: imageFile,
        mode,
        selections: mode === 'furnish' ? selections : {},
        extraPrompt,
        aspectRatio,
        aspectFit,
        imageSize,
        apiKey,
        variations,
      });
      set({ result });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ processing: false });
    }
  },
}));
