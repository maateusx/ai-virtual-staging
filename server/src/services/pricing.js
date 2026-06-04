// Cost estimation for image generations.
//
// Gemini bills per token: cheap input (prompt + input image) and expensive
// output (the generated image, a fixed ~1290 tokens each). We turn the token
// usage we already collect into an estimated cost in USD and BRL.
//
// Rates are configurable via env so they can track Gemini's price sheet without
// a code change. Defaults follow Gemini image pricing: $0.30 / 1M input tokens,
// $30 / 1M output (image) tokens.

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// USD price per 1,000,000 tokens.
const INPUT_USD_PER_M = num(process.env.GEMINI_INPUT_USD_PER_M, 0.3);
const OUTPUT_USD_PER_M = num(process.env.GEMINI_OUTPUT_USD_PER_M, 30);
// USD -> BRL conversion rate.
const USD_TO_BRL = num(process.env.USD_TO_BRL, 5.4);

/**
 * Estimate the cost of a generation from its token usage.
 * @param {{prompt_tokens?: number, output_tokens?: number}} usage
 * @returns {{usd: number, brl: number, input_usd: number, output_usd: number, usd_to_brl: number}}
 */
export function estimateCost(usage) {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;

  const inputUsd = (promptTokens / 1_000_000) * INPUT_USD_PER_M;
  const outputUsd = (outputTokens / 1_000_000) * OUTPUT_USD_PER_M;
  const usd = inputUsd + outputUsd;

  return {
    usd,
    brl: usd * USD_TO_BRL,
    input_usd: inputUsd,
    output_usd: outputUsd,
    usd_to_brl: USD_TO_BRL,
  };
}
