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
  maskFile: null, // painted mask PNG for localized-edit mode
  mode: 'furnish', // furnish | empty | declutter | edit
  selections: {}, // parameterId -> optionId | [optionId]
  extraPrompt: '',
  aspectRatio: null,
  aspectFit: null,
  imageSize: null,
  variations: 1, // how many options to generate per request (1..4)
  apiKey: loadApiKey(),

  // Optional local watermark (a user-supplied PNG stamped over the output).
  watermarkFile: null,
  watermarkPreview: null,
  watermarkVertical: 'bottom', // top | middle | bottom
  watermarkHorizontal: 'right', // left | center | right
  watermarkSize: 20, // width as % of the output image
  watermarkOpacity: 100, // 5..100 (%)
  watermarkColor: null, // hex string to recolor the mark, or null for its own colours

  // Editable final-prompt preview (the accordion shown before processing).
  promptDraft: '', // current text in the editor (auto-composed or user-edited)
  promptEdited: false, // user manually changed the draft → send it as override
  previewLoading: false,

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
      maskFile: null, // a new photo invalidates any painted mask
      promptDraft: '',
      promptEdited: false,
      result: null,
      error: null,
    });
  },

  // Switching modes clears any painted mask (it only applies to the photo it
  // was drawn on, in edit mode).
  setMode: (mode) => set({ mode, maskFile: null }),

  setMaskFile: (maskFile) => set({ maskFile }),

  setSelection: (parameterId, value) =>
    set((s) => ({ selections: { ...s.selections, [parameterId]: value } })),

  setExtraPrompt: (extraPrompt) => set({ extraPrompt }),

  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setAspectFit: (aspectFit) => set({ aspectFit }),
  setImageSize: (imageSize) => set({ imageSize }),
  setVariations: (variations) => set({ variations }),

  setWatermarkFile: (file) => {
    const prev = get().watermarkPreview;
    if (prev) URL.revokeObjectURL(prev);
    set({
      watermarkFile: file,
      watermarkPreview: file ? URL.createObjectURL(file) : null,
    });
  },
  setWatermarkVertical: (watermarkVertical) => set({ watermarkVertical }),
  setWatermarkHorizontal: (watermarkHorizontal) => set({ watermarkHorizontal }),
  setWatermarkSize: (watermarkSize) => set({ watermarkSize }),
  setWatermarkOpacity: (watermarkOpacity) => set({ watermarkOpacity }),
  setWatermarkColor: (watermarkColor) => set({ watermarkColor }),

  // Fetch the auto-composed prompt for the current settings. Skips the network
  // call (and leaves the text alone) once the user has manually edited it.
  loadPromptPreview: async () => {
    if (get().promptEdited) return;
    const { mode, selections, extraPrompt } = get();
    set({ previewLoading: true });
    try {
      const { composed_prompt } = await api.previewPrompt({
        mode,
        selections: mode === 'furnish' ? selections : {},
        extraPrompt,
      });
      // Guard against a race: bail if the user started editing meanwhile.
      if (!get().promptEdited) set({ promptDraft: composed_prompt });
    } catch {
      // Preview is best-effort; ignore failures (the server still composes on run).
    } finally {
      set({ previewLoading: false });
    }
  },

  setPromptDraft: (promptDraft) => set({ promptDraft, promptEdited: true }),

  // Drop the manual edit and re-sync the draft with the current settings.
  resetPromptDraft: () => {
    set({ promptEdited: false });
    get().loadPromptPreview();
  },

  setApiKey: (apiKey) => {
    try {
      if (apiKey) localStorage.setItem(API_KEY_STORAGE, apiKey);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    set({ apiKey });
  },

  // Note: the watermark (file + position + size) is intentionally preserved
  // across resets — it's usually the same logo reused for every staging.
  reset: () => {
    const prev = get().imagePreview;
    if (prev) URL.revokeObjectURL(prev);
    const { outputConfig } = get();
    set({
      imageFile: null,
      imagePreview: null,
      maskFile: null,
      selections: {},
      extraPrompt: '',
      aspectRatio: outputConfig?.default_aspect_ratio ?? null,
      aspectFit: outputConfig?.default_aspect_fit ?? null,
      imageSize: outputConfig?.default_image_size ?? null,
      promptDraft: '',
      promptEdited: false,
      result: null,
      error: null,
    });
  },

  process: async () => {
    const {
      imageFile,
      maskFile,
      mode,
      selections,
      extraPrompt,
      aspectRatio,
      aspectFit,
      imageSize,
      apiKey,
      variations,
      promptDraft,
      promptEdited,
      watermarkFile,
      watermarkVertical,
      watermarkHorizontal,
      watermarkSize,
      watermarkOpacity,
      watermarkColor,
    } = get();
    if (!imageFile) {
      set({ error: 'Envie uma imagem primeiro.' });
      return;
    }
    const isEdit = mode === 'edit';
    if (isEdit && !maskFile) {
      set({ error: 'Pinte a área que deseja alterar.' });
      return;
    }
    if (isEdit && !extraPrompt.trim()) {
      set({ error: 'Descreva o que mudar na área pintada.' });
      return;
    }
    // Style selections only apply when furnishing.
    set({ processing: true, error: null, result: null });
    try {
      const result = await api.process({
        image: imageFile,
        mask: isEdit ? maskFile : undefined,
        mode,
        selections: mode === 'furnish' ? selections : {},
        extraPrompt,
        aspectRatio,
        aspectFit,
        imageSize,
        apiKey,
        variations,
        // Only send the override when the user actually edited the prompt.
        promptOverride: promptEdited ? promptDraft.trim() : undefined,
        // Optional local watermark (only when a PNG was supplied).
        watermarkFile: watermarkFile || undefined,
        watermarkVertical,
        watermarkHorizontal,
        watermarkSize,
        watermarkOpacity,
        watermarkColor,
      });
      set({ result });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ processing: false });
    }
  },
}));
