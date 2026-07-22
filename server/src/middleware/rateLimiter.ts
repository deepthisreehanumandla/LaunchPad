import { NextFunction, Request, Response } from 'express';
import { redisClient } from '@config/redis';
import { ApiError } from '@shared/utils/ApiError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

/**
 * Fixed-window rate limiter backed by Redis, so limits hold across multiple
 * Node instances (see architecture doc §10.1) rather than resetting per-process.
 */
export function rateLimiter({ windowMs, max, keyPrefix }: RateLimitOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.id ?? req.ip ?? 'anonymous';
      const key = `ratelimit:${keyPrefix}:${identifier}`;

      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.pexpire(key, windowMs);
      }

      if (count > max) {
        throw ApiError.tooManyRequests('Too many requests. Please try again later.');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
