import http from 'http';
import { createApp } from './app';
import { env } from '@config/env';
import { connectDatabase, disconnectDatabase } from '@config/database';
import { connectRedis, disconnectRedis } from '@config/redis';
import { initializeSocketServer } from './sockets';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);

  const io = await initializeSocketServer(server);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 LaunchPad API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received. Shutting down gracefully...`);
    io.close();
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      // eslint-disable-next-line no-console
      console.log('Shutdown complete.');
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
