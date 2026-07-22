import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '@shared/utils/validation';

export const notificationIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listNotificationsQuerySchema = paginationQuerySchema;

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
