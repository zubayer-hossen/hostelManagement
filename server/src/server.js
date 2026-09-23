import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { startScheduler, stopScheduler } from './jobs/index.js';

async function start() {
  await connectDB();
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    console.info(`[server] Listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
    if (!config.emailEnabled) {
      console.info('[server] EMAIL_HOST not set — emails are printed to this console instead of being sent.');
    }
  });

  startScheduler();

  const shutdown = async (signal) => {
    console.info(`[server] ${signal} received, shutting down...`);
    stopScheduler();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => console.error('[server] Unhandled rejection:', reason));

start().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
