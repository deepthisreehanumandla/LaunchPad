import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { projectService } from './project.service';
import { bookmarkService } from './bookmark.service';
import { ListProjectsQuery } from './project.validation';

export const projectController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const project = await projectService.create(req.user.id, req.body);
    sendSuccess({ res, statusCode: 201, data: { project } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListProjectsQuery;
    const { projects, pagination } = await projectService.list(query, req.user?.id);
    sendSuccess({ res, data: { projects }, pagination });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getById(req.params.id, req.user?.id);
    sendSuccess({ res, data: { project } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const project = await projectService.update(req.params.id, req.user.id, req.body);
    sendSuccess({ res, data: { project } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await projectService.remove(req.params.id, req.user.id);
    sendSuccess({ res, data: { deleted: true } });
  }),

  toggleBookmark: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await bookmarkService.toggle(req.user.id, req.params.id);
    sendSuccess({ res, data: result });
  }),
};
