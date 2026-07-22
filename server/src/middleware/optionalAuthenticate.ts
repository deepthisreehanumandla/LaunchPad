import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@shared/utils/jwt';

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
  } catch {
    // Invalid/expired token on a public route — proceed unauthenticated
    // rather than rejecting; the client should still get the public view.
  }

  next();
}
