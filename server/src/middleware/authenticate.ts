import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '@shared/utils/jwt';
import { ApiError } from '@shared/utils/ApiError';

/**
 * Requires a valid `Authorization: Bearer <accessToken>` header.
 * On success, attaches `req.user = { id }`. On failure, forwards a 401
 * to the centralized error handler rather than responding directly.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid access token', 'TOKEN_INVALID'));
  }
}
