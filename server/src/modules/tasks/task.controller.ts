import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { taskService } from './task.service';

export const taskController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const tasks = await taskService.list(req.params.id, req.user.id);
    sendSuccess({ res, data: { tasks } });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const task = await taskService.create(req.params.id, req.user.id, req.body);
    sendSuccess({ res, statusCode: 201, data: { task } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const task = await taskService.update(req.params.id, req.params.taskId, req.user.id, req.body);
    sendSuccess({ res, data: { task } });
  }),

  move: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const task = await taskService.move(req.params.id, req.params.taskId, req.user.id, req.body);
    sendSuccess({ res, data: { task } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await taskService.remove(req.params.id, req.params.taskId);
    sendSuccess({ res, data: { deleted: true } });
  }),
};
