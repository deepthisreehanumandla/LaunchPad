import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { activityService } from './activity.service';
import { teamService } from '@modules/teams/team.service';
import { ListActivityQuery } from './activity.validation';

export const activityController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();

    const isMember = await teamService.isActiveMember(req.params.id, req.user.id);
    if (!isMember) {
      throw ApiError.forbidden('Only project members can view this project\u2019s activity');
    }

    const { page, limit } = req.query as unknown as ListActivityQuery;
    const { activities, pagination } = await activityService.listForProject(req.params.id, page, limit);
    sendSuccess({ res, data: { activities }, pagination });
  }),
};
