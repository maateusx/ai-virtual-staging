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

  process: ({
    image,
    selections,
    extraPrompt,
    mode,
    aspectRatio,
    aspectFit,
    imageSize,
    apiKey,
    variations,
  }) => {
    const fd = new FormData();
    fd.append('image', image);
    fd.append('selections', JSON.stringify(selections));
    if (extraPrompt) fd.append('extra_prompt', extraPrompt);
    if (mode) fd.append('mode', mode);
    if (aspectRatio) fd.append('aspect_ratio', aspectRatio);
    if (aspectFit) fd.append('aspect_fit', aspectFit);
    if (imageSize) fd.append('image_size', imageSize);
    if (apiKey) fd.append('gemini_api_key', apiKey);
    if (variations) fd.append('variations', String(variations));
    return fetch(`${API_URL}/v1/staging`, { method: 'POST', body: fd }).then(handle);
  },

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
