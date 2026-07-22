import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { notificationService } from './notification.service';
import { ListNotificationsQuery } from './notification.validation';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { page, limit } = req.query as unknown as ListNotificationsQuery;
    const { notifications, pagination } = await notificationService.listForUser(req.user.id, page, limit);
    sendSuccess({ res, data: { notifications }, pagination });
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const count = await notificationService.getUnreadCount(req.user.id);
    sendSuccess({ res, data: { count } });
  }),

  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await notificationService.markAsRead(req.params.id, req.user.id);
    sendSuccess({ res, data: { read: true } });
  }),

  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await notificationService.markAllAsRead(req.user.id);
    sendSuccess({ res, data: { read: true } });
  }),
};
