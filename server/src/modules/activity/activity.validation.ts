import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '@shared/utils/validation';

export const projectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listActivityQuerySchema = paginationQuerySchema;

export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
