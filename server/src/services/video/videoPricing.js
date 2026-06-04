// Cost estimation for video generations.
//
// Unlike image generation (billed per token), Veo bills purely PER SECOND of
// output and returns no token usage. So cost = durationSeconds × rate(resolution),
// where the per-second rates live in the model registry (they're model- and
// resolution-specific — too many for env vars). Only the USD→BRL rate is shared
// with image pricing via env.

import { getModelDescriptor } from './registry.js';

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// USD -> BRL conversion rate (shared with image pricing).
const USD_TO_BRL = num(process.env.USD_TO_BRL, 5.4);

/**
 * Estimate the cost of a video generation.
 * @param {{model: string, resolution: string, durationSeconds: number}} args
 * @returns {{usd:number, brl:number, usd_to_brl:number, price_per_second_usd:number,
 *   duration_seconds:number, resolution:string}}
 */
export function estimateVideoCost({ model, resolution, durationSeconds }) {
  const descriptor = getModelDescriptor(model);
  const rate = descriptor?.pricePerSecondUsd?.[resolution] ?? 0;
  const usd = rate * (durationSeconds ?? 0);

  return {
    usd,
    brl: usd * USD_TO_BRL,
    usd_to_brl: USD_TO_BRL,
    price_per_second_usd: rate,
    duration_seconds: durationSeconds ?? 0,
    resolution,
  };
}
