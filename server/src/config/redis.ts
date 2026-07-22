import Redis from 'ioredis';
import { env } from './env';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redisClient.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Redis connection error:', err);
});

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  redisClient.disconnect();
}
