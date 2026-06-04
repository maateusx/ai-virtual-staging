// Builds the final instruction sent to the image model (spec §6):
//   [base] + [fragments of chosen options, in parameter order] + [extra_prompt]
//
// The base template depends on the chosen mode:
//   furnish   – add furniture to an empty room (the original product flow)
//   empty     – remove all furniture/decor, leaving a clean empty room
//   declutter – remove excess, keeping only the minimal original pieces
// Style fragments only make sense when furnishing, so they are skipped in the
// removal modes; the free-text extra_prompt still applies to every mode.

// Strong geometry/perspective lock. Image models tend to re-render the whole
// scene unless explicitly told this is a precise edit of the same photograph.
const PRESERVE =
  'This is a precise edit of the same photograph: do not change the camera ' +
  'angle, position, zoom, framing or perspective, and do not redraw or move ' +
  'any architecture. Keep every wall, ceiling, floor, window, door, column, ' +
  'beam and structural element in exactly the same position, geometry, ' +
  'proportions and orientation as the original. Match the original resolution, ' +
  'lens distortion and vanishing points pixel-for-pixel; only the requested ' +
  'change to the furniture is allowed.';

// Removal modes (empty/declutter) must never invent anything to fill the space
// left by a removed object. Where furniture is taken out, the revealed surface
// must be reconstructed as a plain continuation of the SAME wall or floor that
// surrounds it — never a new door, window, opening, appliance or piece of
// furniture.
const NO_ADDITIONS =
  'Do not add, invent or introduce any new object: no new furniture, decor, ' +
  'appliances, doors, windows, openings, niches, fixtures or architectural ' +
  'elements of any kind. When an object is removed, fill the space it occupied ' +
  'by seamlessly extending the existing wall and floor that surround it, ' +
  'matching their exact color, material, texture, baseboard and lighting. The ' +
  'revealed area must look like blank, uninterrupted wall and floor — never a ' +
  'door, window or any other feature that was not in the original photograph.';

// Quality enhancement / upscale. Strict fidelity: nothing in the scene changes,
// the image just comes back sharper and at higher resolution. The output
// format controls (aspect ratio, resolution) still apply, so this runs through
// the normal generation pipeline like the other non-edit modes.
const ENHANCE_TEMPLATE =
  'Ultra-high-resolution 4K enhancement based strictly on the provided ' +
  'reference image. Absolute fidelity to original facial anatomy, proportions, ' +
  'and identity. Preserve expression, gaze, pose, camera angle, framing, and ' +
  'perspective with zero deviation. Clothing, hair, skin, and background ' +
  'elements must remain unchanged in structure, placement, and design. Recover ' +
  'fine-grain detail with natural realism. Enhance pores, fine lines, hair ' +
  'strands, eyelashes, fabric weave, seams, and material edges without ' +
  'introducing stylization. Maintain original color science, white balance, and ' +
  'tonal relationships exactly as captured. Lighting direction, intensity, ' +
  'contrast, and shadow behavior must match the source image precisely, with ' +
  'only improved clarity and expanded dynamic range. No relighting, no ' +
  'reshaping. Remove any grain. Apply controlled sharpening and high-frequency ' +
  'detail reconstruction. Remove compression artifacts and noise while ' +
  'retaining authentic texture. No smoothing, no plastic skin, no artificial ' +
  'gloss. Facial features must remain consistent across the entire image with ' +
  'coherent anatomy and clean, stable edges. Negative constraints: no warping, ' +
  'no facial drift, no added or missing anatomy, no altered hands, no ' +
  'distortions, no perspective shift, no text or graphics, no hallucinated ' +
  'detail, no stylized rendering. Output must read as a true-to-life, ' +
  'photorealistic upscale that matches the reference exactly, only clearer, ' +
  'sharper, and higher resolution.';

const BASE_TEMPLATES = {
  furnish:
    'Add furniture and decor to this room. ' +
    `${PRESERVE} Place the new furniture realistically on the existing floor.`,
  empty:
    'Remove all furniture, decor and clutter from this room, leaving it ' +
    'completely empty and clean. Realistically reconstruct the floor and walls ' +
    `that were hidden behind the removed objects. ${NO_ADDITIONS} ${PRESERVE}`,
  declutter:
    'Remove excess furniture, clutter and decor from this room, keeping only ' +
    'a minimal set of the essential original pieces. Do not replace, restyle or ' +
    'rearrange the pieces you keep — leave them exactly as they are. ' +
    'Realistically reconstruct the floor and walls revealed where objects were ' +
    `removed. ${NO_ADDITIONS} ${PRESERVE}`,
  enhance: ENHANCE_TEMPLATE,
};

// Public list of modes (id + label) for the config endpoint / UI toggle.
export const STAGING_MODES = [
  { id: 'furnish', label: 'Mobiliar' },
  { id: 'empty', label: 'Esvaziar' },
  { id: 'declutter', label: 'Minimizar' },
  { id: 'enhance', label: 'Melhorar qualidade' },
  { id: 'edit', label: 'Editar' },
];

// Localized edit (inpaint) is a distinct flow: it has no style fragments and is
// driven by a painted mask + a free-text instruction rather than a base
// template, so it lives outside BASE_TEMPLATES.
export const EDIT_MODE = 'edit';

export const DEFAULT_MODE = 'furnish';

const TAIL = 'Photorealistic, consistent lighting and shadows.';

export function isValidMode(mode) {
  return mode === EDIT_MODE || Object.prototype.hasOwnProperty.call(BASE_TEMPLATES, mode);
}

/**
 * Build the instruction for a masked, localized edit. The model receives the
 * photo plus a black/white mask (white = the painted region); it must change
 * only that region and leave the rest untouched. The server then composites the
 * result back over the original so unmasked pixels are guaranteed identical
 * (the model tends to subtly re-render the whole frame).
 *
 * @param {string} instruction  free-text description of the desired change
 * @returns {{ composedPrompt: string }}
 */
export function composeEditPrompt(instruction) {
  const change = (instruction || '').trim().replace(/\.$/, '');
  const composedPrompt =
    'You are given a photograph and, as a second image, a black-and-white mask. ' +
    'The white area of the mask marks the only region of the photograph you may ' +
    'change; the black area must stay exactly as in the original. Edit only the ' +
    `white-masked region of the photograph to: ${change}. Keep everything ` +
    'outside that region pixel-for-pixel identical to the original — same walls, ' +
    'floor, ceiling, furniture, colors, lighting and perspective. Inside the ' +
    'edited region, match the surrounding perspective, lighting direction, ' +
    'shadows, color temperature, materials and grain so the change blends in ' +
    `seamlessly with no visible mask edge. ${TAIL}`;
  return { composedPrompt };
}

/**
 * @param {Array} parameters  Active StagingParameter docs (sorted by order).
 * @param {Object} selections Map of parameterId -> optionId | [optionId].
 * @param {string} extraPrompt Free-text addition (optional).
 * @param {string} mode One of STAGING_MODES ids (defaults to furnish).
 * @returns {{ composedPrompt: string, fragments: string[] }}
 */
export function composePrompt(parameters, selections, extraPrompt = '', mode = DEFAULT_MODE) {
  const base = BASE_TEMPLATES[mode] ?? BASE_TEMPLATES[DEFAULT_MODE];

  // Style fragments only apply when furnishing.
  const fragments = [];
  if (mode === 'furnish') {
    for (const param of parameters) {
      const raw = selections?.[param._id.toString()];
      if (raw == null) continue;

      const chosenIds = Array.isArray(raw) ? raw : [raw];
      for (const optionId of chosenIds) {
        const option = param.options.id(optionId);
        if (option && option.active) {
          fragments.push(option.prompt_fragment.trim().replace(/\.$/, ''));
        }
      }
    }
  }

  const parts = [base];

  if (fragments.length > 0) {
    parts.push(`${fragments.join('; ')}.`);
  }

  const extra = extraPrompt?.trim();
  if (extra) {
    parts.push(extra.endsWith('.') ? extra : `${extra}.`);
  }

  parts.push(TAIL);

  return {
    composedPrompt: parts.join(' '),
    fragments,
  };
}
