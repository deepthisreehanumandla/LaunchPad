import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '@shared/utils/validation';

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must be at most 4000 characters'),
});

export const projectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listMessagesQuerySchema = paginationQuerySchema;

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
