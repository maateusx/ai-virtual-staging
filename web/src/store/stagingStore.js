import { create } from 'zustand';
import { api } from '@/lib/api';

// State for the processing (staging) screen.
export const useStagingStore = create((set, get) => ({
  parameters: [],
  loadingConfig: false,

  imageFile: null,
  imagePreview: null,
  selections: {}, // parameterId -> optionId | [optionId]
  extraPrompt: '',

  processing: false,
  result: null, // { result_image_url, composed_prompt, model, processing_ms }
  error: null,

  loadConfig: async () => {
    set({ loadingConfig: true, error: null });
    try {
      const { parameters } = await api.getConfig();
      set({ parameters });
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

  setSelection: (parameterId, value) =>
    set((s) => ({ selections: { ...s.selections, [parameterId]: value } })),

  setExtraPrompt: (extraPrompt) => set({ extraPrompt }),

  reset: () => {
    const prev = get().imagePreview;
    if (prev) URL.revokeObjectURL(prev);
    set({
      imageFile: null,
      imagePreview: null,
      selections: {},
      extraPrompt: '',
      result: null,
      error: null,
    });
  },

  process: async () => {
    const { imageFile, selections, extraPrompt } = get();
    if (!imageFile) {
      set({ error: 'Envie uma imagem primeiro.' });
      return;
    }
    set({ processing: true, error: null, result: null });
    try {
      const result = await api.process({ image: imageFile, selections, extraPrompt });
      set({ result });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ processing: false });
    }
  },
}));
