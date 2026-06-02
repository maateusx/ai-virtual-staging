// Builds the final instruction sent to the image model (spec §6):
//   [base] + [fragments of chosen options, in parameter order] + [extra_prompt]

const BASE_TEMPLATE =
  'Furnish this empty room. Keep the walls, windows, floor and camera ' +
  'perspective exactly unchanged; only add furniture and decor.';

const TAIL = 'Photorealistic, consistent lighting and shadows.';

/**
 * @param {Array} parameters  Active StagingParameter docs (sorted by order).
 * @param {Object} selections Map of parameterId -> optionId | [optionId].
 * @param {string} extraPrompt Free-text addition (optional).
 * @returns {{ composedPrompt: string, fragments: string[] }}
 */
export function composePrompt(parameters, selections, extraPrompt = '') {
  const fragments = [];

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

  const parts = [BASE_TEMPLATE];

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
