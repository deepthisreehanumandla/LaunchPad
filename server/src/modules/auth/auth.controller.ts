import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { env, isProduction } from '@config/env';
import { authService } from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/v1/auth', // scope the cookie to auth endpoints only
};

function getDeviceContext(req: Request) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(env.REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body, getDeviceContext(req));
    setRefreshCookie(res, result.refreshToken);
    sendSuccess({
      res,
      statusCode: 201,
      data: { user: result.user, accessToken: result.accessToken },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, getDeviceContext(req));
    setRefreshCookie(res, result.refreshToken);
    sendSuccess({
      res,
      data: { user: result.user, accessToken: result.accessToken },
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (!token) {
      throw ApiError.unauthorized('No refresh token provided', 'REFRESH_TOKEN_MISSING');
    }

    const tokens = await authService.refresh(token, getDeviceContext(req));
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess({ res, data: { accessToken: tokens.accessToken } });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (token) {
      await authService.logout(token);
    }
    clearRefreshCookie(res);
    sendSuccess({ res, data: { loggedOut: true } });
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    await authService.logoutAll(req.user.id);
    clearRefreshCookie(res);
    sendSuccess({ res, data: { loggedOut: true } });
  }),
};
