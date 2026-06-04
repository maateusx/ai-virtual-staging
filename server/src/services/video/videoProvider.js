// Video provider façade — what the route and poller call. Resolves a model id to
// its provider via the registry and delegates the start/poll/download contract.
//
// This is the single seam a future provider plugs into:
//   1. implement a provider object { id, start, poll, download }
//   2. register it in PROVIDERS below
//   3. add its models to VIDEO_MODELS (registry.js) with provider: '<id>'
// No route, pricing or storage changes needed.

import { getModelDescriptor } from './registry.js';
import { geminiVideoProvider } from './providers/gemini.js';
import { ProviderError } from './errors.js';

const PROVIDERS = {
  gemini: geminiVideoProvider,
};

function providerFor(modelId) {
  const descriptor = getModelDescriptor(modelId);
  if (!descriptor) throw new ProviderError(`unknown video model: ${modelId}`);
  const provider = PROVIDERS[descriptor.provider];
  if (!provider) throw new ProviderError(`no provider registered for: ${descriptor.provider}`);
  return provider;
}

// Provider contract:
//   start(args) -> { operationName: string, operation: object }
//   poll({ operationName, operation, apiKey }) -> { done, operation, errorMessage }
//   download({ operation, apiKey }) -> { buffer, mime }
export const startVideo = (args) => providerFor(args.model).start(args);
export const pollVideo = (modelId, args) => providerFor(modelId).poll(args);
export const downloadVideo = (modelId, args) => providerFor(modelId).download(args);

export { ProviderError, MissingApiKeyError } from './errors.js';
