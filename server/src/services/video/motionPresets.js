// Camera-motion presets for image-to-video (the video analogue of
// promptBuilder.js). The user never describes the room — the uploaded photo IS
// the scene — they only pick HOW the camera should move through it. Every preset
// is wrapped with the same hard constraint: only the camera moves, the room and
// everything in it stays exactly as photographed.
//
// Shape mirrors STAGING_MODES: { id, label } is public; `prompt` is the camera
// fragment merged server-side. Pure data, safe to serialize to the UI.

// The non-negotiable lock, appended LAST so it's the final instruction Veo sees.
// Reinforces, for the video case: the scene is frozen, only the camera moves,
// nothing about the architecture/geometry changes and nothing new is invented.
const STILL_SCENE =
  'Animate ONLY the camera. The room and everything inside it is completely ' +
  'static and frozen: every wall, ceiling, floor, window, door, column, beam, ' +
  'piece of furniture and object stays in exactly the same position, shape, ' +
  'size and proportion as in the source photograph. Do not rebuild, distort, ' +
  'bend, stretch or reinterpret the architecture or the geometry of the space. ' +
  'Do not add, remove, replace, duplicate or invent anything that is not ' +
  'already visible in the photo — no new furniture, decor, people, plants, ' +
  'openings, doors, windows or fixtures of any kind. No morphing, no warping ' +
  'walls, no objects growing, shrinking or sliding on their own. The result ' +
  'must look like a real camera moving smoothly through the exact same, ' +
  'unchanged room. Photorealistic, stable, with consistent lighting and shadows.';

// Each preset's `prompt` describes ONLY the camera path. Keep them slow and
// gentle — aggressive moves make Veo hallucinate new geometry.
export const MOTION_PRESETS = [
  {
    id: 'still',
    label: 'Apenas mover a foto',
    prompt:
      'The camera stays almost still, with a very subtle and slow push-in and ' +
      'gentle 2.5D parallax, as if the photograph quietly comes to life. The ' +
      'movement is minimal, smooth and barely noticeable.',
  },
  {
    id: 'walk',
    label: 'Andar pelo ambiente',
    prompt:
      'The camera slowly dollies forward, moving deeper into the room at a calm, ' +
      'steady pace, as if someone is gently walking through the space.',
  },
  {
    id: 'pan',
    label: 'Panorâmica',
    prompt:
      'The camera slowly pans horizontally across the room, smoothly sweeping ' +
      'from one side to the other to reveal the space.',
  },
  {
    id: 'orbit',
    label: 'Girar ao redor',
    prompt:
      'The camera gently arcs sideways through the room in a slow, smooth ' +
      'orbital move that adds subtle depth and dimension to the scene.',
  },
  {
    id: 'pullback',
    label: 'Afastar e revelar',
    prompt:
      'The camera slowly pulls backward, gradually widening the view to reveal ' +
      'more of the room.',
  },
];

export const DEFAULT_MOTION = 'still';

const MOTION_BY_ID = new Map(MOTION_PRESETS.map((m) => [m.id, m]));

export function isValidMotion(id) {
  return MOTION_BY_ID.has(id);
}

// Public list for /v1/video/config — only id + label, no internal prompt text.
export function publicMotions() {
  return MOTION_PRESETS.map(({ id, label }) => ({ id, label }));
}

/**
 * Build the final prompt sent to the video model:
 *   [camera motion] + [optional free-text detail] + [STILL_SCENE lock]
 *
 * The free-text is treated as an optional refinement of the motion only; the
 * lock always comes last so the geometry/no-additions constraint wins.
 *
 * @param {string} motionId  one of MOTION_PRESETS ids (defaults to DEFAULT_MOTION)
 * @param {string} extra     optional free-text detail
 * @returns {string} the composed prompt
 */
export function composeVideoPrompt(motionId, extra = '') {
  const preset = MOTION_BY_ID.get(motionId) ?? MOTION_BY_ID.get(DEFAULT_MOTION);
  const parts = [preset.prompt];

  const detail = (extra || '').trim();
  if (detail) parts.push(detail.endsWith('.') ? detail : `${detail}.`);

  parts.push(STILL_SCENE);
  return parts.join(' ');
}
