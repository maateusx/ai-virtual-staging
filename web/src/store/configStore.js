import { create } from 'zustand';
import { api } from '@/lib/api';

// State for the admin configuration screen.
export const useConfigStore = create((set, get) => ({
  parameters: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const { parameters } = await api.listParameters();
      set({ parameters });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createParameter: async (data) => {
    await api.createParameter(data);
    await get().load();
  },

  updateParameter: async (id, data) => {
    await api.updateParameter(id, data);
    await get().load();
  },

  deleteParameter: async (id) => {
    await api.deleteParameter(id);
    await get().load();
  },

  createOption: async (paramId, data) => {
    await api.createOption(paramId, data);
    await get().load();
  },

  updateOption: async (paramId, optionId, data) => {
    await api.updateOption(paramId, optionId, data);
    await get().load();
  },

  deleteOption: async (paramId, optionId) => {
    await api.deleteOption(paramId, optionId);
    await get().load();
  },
}));
