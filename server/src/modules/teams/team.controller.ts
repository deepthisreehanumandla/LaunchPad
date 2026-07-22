import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { teamService } from './team.service';

export const teamController = {
  sendJoinRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const joinRequest = await teamService.sendJoinRequest(req.params.id, req.user.id, req.body);
    sendSuccess({ res, statusCode: 201, data: { joinRequest } });
  }),

  listPendingForProject: asyncHandler(async (req: Request, res: Response) => {
    const joinRequests = await teamService.listPendingForProject(req.params.id);
    sendSuccess({ res, data: { joinRequests } });
  }),

  acceptJoinRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.project) throw ApiError.unauthorized();
    const joinRequest = await teamService.acceptJoinRequest(req.project, req.params.reqId, req.user.id);
    sendSuccess({ res, data: { joinRequest } });
  }),

  rejectJoinRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.project) throw ApiError.unauthorized();
    const joinRequest = await teamService.rejectJoinRequest(req.project, req.params.reqId, req.user.id);
    sendSuccess({ res, data: { joinRequest } });
  }),

  listMembers: asyncHandler(async (req: Request, res: Response) => {
    const members = await teamService.listMembers(req.params.id);
    sendSuccess({ res, data: { members } });
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    if (!req.project) throw ApiError.unauthorized();
    await teamService.removeMember(req.project, req.params.userId);
    sendSuccess({ res, data: { removed: true } });
  }),
};
