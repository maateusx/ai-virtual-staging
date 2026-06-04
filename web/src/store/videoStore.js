import { create } from 'zustand';
import { api } from '@/lib/api';

// Reuse the SAME key the staging flow stores, so BYOK is shared across pages.
const API_KEY_STORAGE = 'decorar:gemini_api_key';
const loadApiKey = () => {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
};

// Module-scoped poll timer so we can cancel it on reset/unmount.
let pollTimer = null;
const POLL_INTERVAL_MS = 4000;

// Pick the model descriptor from the loaded config.
const findModel = (models, id) => models.find((m) => m.id === id) ?? models[0] ?? null;

// State for the async image-to-video screen.
export const useVideoStore = create((set, get) => ({
  models: [], // [{ id, label, aspect_ratios, resolutions, durations, supports_audio, price_per_second_usd, defaults }]
  motions: [], // [{ id, label }] camera-motion presets
  serverHasKey: true,
  loadingConfig: false,

  imageFile: null,
  imagePreview: null,
  model: null,
  motion: null,
  aspectRatio: null,
  resolution: null,
  duration: null,
  audio: false,
  prompt: '',
  apiKey: loadApiKey(),

  jobId: null,
  status: 'idle', // idle | processing | done | error
  result: null, // { result_video_url, model, aspect_ratio, resolution, duration_seconds, cost, processing_ms }
  error: null,
  submitting: false,

  loadConfig: async () => {
    set({ loadingConfig: true, error: null });
    try {
      const { models, default_model, motions, default_motion, server_has_key } =
        await api.getVideoConfig();
      set((s) => {
        const list = models ?? [];
        const motionList = motions ?? [];
        const model = s.model ?? default_model ?? list[0]?.id ?? null;
        const descriptor = findModel(list, model);
        const d = descriptor?.defaults ?? {};
        return {
          models: list,
          motions: motionList,
          serverHasKey: server_has_key ?? true,
          model,
          motion: s.motion ?? default_motion ?? motionList[0]?.id ?? null,
          aspectRatio: s.aspectRatio ?? d.aspect_ratio ?? null,
          resolution: s.resolution ?? d.resolution ?? null,
          duration: s.duration ?? d.duration ?? null,
        };
      });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loadingConfig: false });
    }
  },

  setImage: (file) => {
    const prev = get().imagePreview;
    if (prev) URL.revokeObjectURL(prev);
    get().stopPolling();
    set({
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : null,
      jobId: null,
      status: 'idle',
      result: null,
      error: null,
    });
  },

  // Switching models resets aspect/resolution/duration to that model's defaults
  // (and drops audio when unsupported) so the request can't be invalid. The
  // server still re-validates.
  setModel: (modelId) => {
    const descriptor = findModel(get().models, modelId);
    const d = descriptor?.defaults ?? {};
    set({
      model: modelId,
      aspectRatio: d.aspect_ratio ?? null,
      resolution: d.resolution ?? null,
      duration: d.duration ?? null,
      audio: descriptor?.supports_audio ? get().audio : false,
    });
  },

  setMotion: (motion) => set({ motion }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setDuration: (duration) => set({ duration }),
  setAudio: (audio) => set({ audio }),
  setPrompt: (prompt) => set({ prompt }),

  setApiKey: (apiKey) => {
    try {
      if (apiKey) localStorage.setItem(API_KEY_STORAGE, apiKey);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    set({ apiKey });
  },

  // Create the job and begin polling for the result.
  create: async () => {
    const { imageFile, model, motion, aspectRatio, resolution, duration, prompt, audio, apiKey } =
      get();
    if (!imageFile) {
      set({ error: 'Envie uma imagem primeiro.' });
      return;
    }
    get().stopPolling();
    set({ submitting: true, error: null, result: null, status: 'processing', jobId: null });
    try {
      const { job_id } = await api.createVideo({
        image: imageFile,
        model,
        motion,
        aspectRatio,
        resolution,
        duration,
        prompt,
        audio,
        apiKey,
      });
      set({ jobId: job_id, submitting: false });
      get().poll();
    } catch (err) {
      set({ error: err.message, status: 'error', submitting: false });
    }
  },

  // Recursive setTimeout poll until the job is done/error.
  poll: () => {
    const tick = async () => {
      const { jobId } = get();
      if (!jobId) return;
      try {
        const job = await api.getVideo(jobId);
        if (job.status === 'done') {
          set({ status: 'done', result: job, error: null });
        } else if (job.status === 'error') {
          set({ status: 'error', error: job.error || 'Falha ao gerar o vídeo.' });
        } else {
          set({ status: job.status });
          pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch (err) {
        set({ status: 'error', error: err.message });
      }
    };
    tick();
  },

  stopPolling: () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  },

  reset: () => {
    const prev = get().imagePreview;
    if (prev) URL.revokeObjectURL(prev);
    get().stopPolling();
    set({
      imageFile: null,
      imagePreview: null,
      prompt: '',
      jobId: null,
      status: 'idle',
      result: null,
      error: null,
      submitting: false,
    });
  },
}));
