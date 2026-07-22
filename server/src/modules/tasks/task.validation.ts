import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from './task.model';
import { objectIdSchema } from '@shared/utils/validation';

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150, 'Title must be at most 150 characters'),
  description: z.string().trim().max(3000, 'Description must be at most 3000 characters').optional(),
  priority: z.enum(TASK_PRIORITIES, { errorMap: () => ({ message: 'Priority must be low, medium, or high' }) }).default('medium'),
  dueDate: z.coerce.date({ invalid_type_error: 'Invalid due date' }).optional(),
  assignee: objectIdSchema.optional(),
  status: z.enum(TASK_STATUSES).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150, 'Title must be at most 150 characters').optional(),
  description: z.string().trim().max(3000, 'Description must be at most 3000 characters').optional(),
  priority: z.enum(TASK_PRIORITIES, { errorMap: () => ({ message: 'Priority must be low, medium, or high' }) }).optional(),
  dueDate: z.coerce.date({ invalid_type_error: 'Invalid due date' }).nullable().optional(),
  assignee: objectIdSchema.nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
});

export const moveTaskSchema = z.object({
  status: z.enum(TASK_STATUSES, { errorMap: () => ({ message: 'Invalid task status' }) }),
  order: z.coerce.number().min(0).default(0),
});

export const projectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const taskIdParamSchema = z.object({
  id: objectIdSchema,
  taskId: objectIdSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
