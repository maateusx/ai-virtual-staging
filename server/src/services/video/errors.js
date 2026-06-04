// Error types for the video pipeline. Kept separate from imageProvider.js so the
// video route can `instanceof`-check against these exact classes (instanceof is
// identity-based — the image module's classes are distinct objects).

export class ProviderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ProviderError';
    this.cause = cause;
  }
}

// Thrown when no Gemini key is available (caller-supplied or server). This is a
// client-fixable condition, so the route maps it to a 4xx rather than a 502.
export class MissingApiKeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingApiKeyError';
  }
}
