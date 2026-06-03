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
};

// Public list of modes (id + label) for the config endpoint / UI toggle.
export const STAGING_MODES = [
  { id: 'furnish', label: 'Mobiliar' },
  { id: 'empty', label: 'Esvaziar' },
  { id: 'declutter', label: 'Minimizar' },
];

export const DEFAULT_MODE = 'furnish';

const TAIL = 'Photorealistic, consistent lighting and shadows.';

export function isValidMode(mode) {
  return Object.prototype.hasOwnProperty.call(BASE_TEMPLATES, mode);
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
