const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function handle(res) {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.error || JSON.stringify(body);
    } catch {
      detail = res.statusText;
    }
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ---- Public ----
  getConfig: () => fetch(`${API_URL}/v1/staging/config`).then(handle),

  // Compose the final prompt for the current settings, without generating —
  // used to preview/edit the prompt before running a billed generation.
  previewPrompt: ({ mode, selections, extraPrompt }) =>
    fetch(`${API_URL}/v1/staging/preview-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, selections, extra_prompt: extraPrompt }),
    }).then(handle),

  process: ({
    image,
    mask,
    selections,
    extraPrompt,
    mode,
    aspectRatio,
    aspectFit,
    imageSize,
    apiKey,
    variations,
    promptOverride,
    watermarkFile,
    watermarkVertical,
    watermarkHorizontal,
    watermarkSize,
    watermarkOpacity,
    watermarkColor,
  }) => {
    const fd = new FormData();
    fd.append('image', image);
    if (mask) fd.append('mask', mask);
    if (watermarkFile) {
      fd.append('watermark', watermarkFile);
      if (watermarkVertical) fd.append('watermark_vertical', watermarkVertical);
      if (watermarkHorizontal) fd.append('watermark_horizontal', watermarkHorizontal);
      if (watermarkSize != null) fd.append('watermark_size', String(watermarkSize));
      if (watermarkOpacity != null) fd.append('watermark_opacity', String(watermarkOpacity));
      if (watermarkColor) fd.append('watermark_color', watermarkColor);
    }
    fd.append('selections', JSON.stringify(selections));
    if (extraPrompt) fd.append('extra_prompt', extraPrompt);
    if (mode) fd.append('mode', mode);
    if (aspectRatio) fd.append('aspect_ratio', aspectRatio);
    if (aspectFit) fd.append('aspect_fit', aspectFit);
    if (imageSize) fd.append('image_size', imageSize);
    if (apiKey) fd.append('gemini_api_key', apiKey);
    if (variations) fd.append('variations', String(variations));
    if (promptOverride) fd.append('prompt_override', promptOverride);
    return fetch(`${API_URL}/v1/staging`, { method: 'POST', body: fd }).then(handle);
  },

  // ---- Video (async image-to-video) ----
  getVideoConfig: () => fetch(`${API_URL}/v1/video/config`).then(handle),

  // Start a video job. Returns { job_id, status } immediately (202); the result
  // is fetched by polling getVideo(id) until status === 'done'.
  createVideo: ({
    image,
    image2,
    style,
    model,
    motion,
    aspectRatio,
    resolution,
    duration,
    prompt,
    stagingPrompt,
    audio,
    apiKey,
  }) => {
    const fd = new FormData();
    fd.append('image', image);
    if (image2) fd.append('image2', image2); // 'transform' style: final frame (MANUAL)
    if (style) fd.append('style', style);
    if (model) fd.append('model', model);
    if (motion) fd.append('motion', motion);
    if (aspectRatio) fd.append('aspect_ratio', aspectRatio);
    if (resolution) fd.append('resolution', resolution);
    if (duration != null) fd.append('duration', String(duration));
    if (prompt) fd.append('prompt', prompt);
    if (stagingPrompt) fd.append('staging_prompt', stagingPrompt); // AUTO "after" frame
    if (audio) fd.append('audio', 'true');
    if (apiKey) fd.append('gemini_api_key', apiKey);
    return fetch(`${API_URL}/v1/video`, { method: 'POST', body: fd }).then(handle);
  },

  getVideo: (id) => fetch(`${API_URL}/v1/video/${id}`).then(handle),

  // ---- Admin ----
  listParameters: () =>
    fetch(`${API_URL}/v1/admin/parameters`).then(handle),

  createParameter: (data) =>
    fetch(`${API_URL}/v1/admin/parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  updateParameter: (id, data) =>
    fetch(`${API_URL}/v1/admin/parameters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  deleteParameter: (id) =>
    fetch(`${API_URL}/v1/admin/parameters/${id}`, { method: 'DELETE' }).then(handle),

  createOption: (paramId, data) =>
    fetch(`${API_URL}/v1/admin/parameters/${paramId}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  updateOption: (paramId, optionId, data) =>
    fetch(`${API_URL}/v1/admin/parameters/${paramId}/options/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle),

  deleteOption: (paramId, optionId) =>
    fetch(`${API_URL}/v1/admin/parameters/${paramId}/options/${optionId}`, {
      method: 'DELETE',
    }).then(handle),
};

export { API_URL };
