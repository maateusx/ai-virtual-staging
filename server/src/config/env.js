// Centralised, validated environment configuration.
// Values are read from process.env (populated via `node --env-file`).

const {
  PORT = '3333',
  HOST = '0.0.0.0',
  MONGO_URI = 'mongodb://127.0.0.1:27017/decorar_ai',
  PUBLIC_BASE_URL = 'http://localhost:3333',
  WEB_ORIGIN = 'http://localhost:5173',
  GEMINI_API_KEY = '',
  GEMINI_MODEL = 'gemini-3.1-flash-image',
} = process.env;

export const env = {
  port: Number(PORT),
  host: HOST,
  mongoUri: MONGO_URI,
  publicBaseUrl: PUBLIC_BASE_URL.replace(/\/$/, ''),
  webOrigin: WEB_ORIGIN,
  gemini: {
    key: GEMINI_API_KEY.trim(),
    model: GEMINI_MODEL,
    // Whether the server has its own key. When false, requests must supply a
    // key (BYOK) or they are rejected — there is no mock fallback.
    enabled: GEMINI_API_KEY.trim().length > 0,
  },
};
