import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { env } from './config/env.js';
import { UPLOADS_ROOT } from './services/storage.js';
import { stagingRoutes } from './routes/staging.js';
import { adminRoutes } from './routes/admin.js';
import { videoRoutes } from './routes/video.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
    // Synchronous staging can take up to ~2 min (spec §8).
    requestTimeout: 130_000,
    bodyLimit: 20 * 1024 * 1024,
  });

  await app.register(cors, { origin: env.webOrigin });

  await app.register(multipart, {
    // Two files: the photo plus an optional mask (localized-edit mode).
    limits: { fileSize: 16 * 1024 * 1024, files: 2 },
  });

  // Serve uploaded/generated images.
  await app.register(fastifyStatic, {
    root: UPLOADS_ROOT,
    prefix: '/uploads/',
  });

  app.get('/health', async () => ({
    status: 'ok',
    provider: 'gemini',
    // When false, requests must supply their own key (BYOK).
    server_has_key: env.gemini.enabled,
  }));

  await app.register(stagingRoutes);
  await app.register(adminRoutes);
  await app.register(videoRoutes);

  return app;
}
