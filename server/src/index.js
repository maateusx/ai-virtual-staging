import { buildApp } from './app.js';
import { connectDb, disconnectDb } from './db/index.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();

  try {
    await connectDb(app.log);
    await app.listen({ port: env.port, host: env.host });
    app.log.info(
      env.gemini.enabled
        ? `Image provider: gemini (${env.gemini.model})`
        : 'Image provider: gemini — no server key set; requests must supply their own (BYOK)'
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal) => {
    app.log.info(`${signal} received, shutting down`);
    await app.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
