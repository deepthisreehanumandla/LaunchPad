import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { userService } from './user.service';
import { bookmarkService } from '@modules/projects/bookmark.service';
import { teamService } from '@modules/teams/team.service';

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.getById(req.user.id);
    sendSuccess({ res, data: { user } });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.updateProfile(req.user.id, req.body);
    sendSuccess({ res, data: { user } });
  }),

  getPublicProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getPublicProfile(req.params.id);
    sendSuccess({ res, data: { user } });
  }),

  getUserProjects: asyncHandler(async (req: Request, res: Response) => {
    const projects = await userService.getUserProjects(req.params.id, req.user?.id);
    sendSuccess({ res, data: projects });
  }),

  getMyBookmarks: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const bookmarks = await bookmarkService.listForUser(req.user.id);
    sendSuccess({ res, data: { bookmarks } });
  }),

  getMyJoinRequests: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const joinRequests = await teamService.getMyJoinRequests(req.user.id);
    sendSuccess({ res, data: joinRequests });
  }),
};

