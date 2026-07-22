import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '@shared/utils/validation';

export const sendJoinRequestSchema = z.object({
  message: z.string().trim().max(500, 'Message must be at most 500 characters').optional(),
});

export const projectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const joinRequestParamSchema = z.object({
  id: objectIdSchema,
  reqId: objectIdSchema,
});

export const memberParamSchema = z.object({
  id: objectIdSchema,
  userId: objectIdSchema,
});

export const listJoinRequestsQuerySchema = paginationQuerySchema;

export type SendJoinRequestInput = z.infer<typeof sendJoinRequestSchema>;
export type ListJoinRequestsQuery = z.infer<typeof listJoinRequestsQuerySchema>;
