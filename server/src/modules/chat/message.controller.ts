import { Request, Response } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { sendSuccess } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { messageService } from './message.service';
import { ListMessagesQuery } from './message.validation';

export const messageController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await messageService.assertCanAccessChat(req.params.id, req.user.id);

    const { page, limit } = req.query as unknown as ListMessagesQuery;
    const { messages, pagination } = await messageService.listForProject(req.params.id, page, limit);
    sendSuccess({ res, data: { messages }, pagination });
  }),
};
