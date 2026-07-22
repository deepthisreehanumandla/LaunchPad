import { z } from 'zod';
import {
  PROJECT_CATEGORIES,
  PROJECT_PURPOSES,
  PROJECT_STATUSES,
} from '@shared/constants';
import { objectIdSchema, paginationQuerySchema, optionalUrlField } from '@shared/utils/validation';

export const createProjectSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title must be at most 150 characters'),
  shortDescription: z
    .string()
    .trim()
    .min(10, 'Short description must be at least 10 characters')
    .max(250, 'Short description must be at most 250 characters'),
  detailedDescription: z
    .string()
    .trim()
    .min(20, 'Detailed description must be at least 20 characters')
    .max(5000, 'Detailed description must be at most 5000 characters'),
  category: z.enum(PROJECT_CATEGORIES, { errorMap: () => ({ message: 'Please select a valid category' }) }),
  purpose: z.enum(PROJECT_PURPOSES, { errorMap: () => ({ message: 'Please select a valid project purpose' }) }),
  techStack: z
    .array(z.string().trim().min(1, 'Tech stack items cannot be empty').max(50, 'Each tech stack item must be at most 50 characters'))
    .max(30, 'You can list at most 30 tech stack items')
    .default([]),
  requiredSkills: z
    .array(z.string().trim().min(1, 'Required skills cannot be empty').max(50, 'Each required skill must be at most 50 characters'))
    .max(30, 'You can list at most 30 required skills')
    .default([]),
  teamSize: z.coerce.number({ invalid_type_error: 'Team size must be a number' }).int('Team size must be a whole number').min(1, 'Team size must be at least 1').max(50, 'Team size must be at most 50'),
  deadline: z.coerce.date({ invalid_type_error: 'Invalid deadline date' }).optional(),
  bannerImage: optionalUrlField('Banner Image').optional(),
  githubUrl: optionalUrlField('GitHub').optional(),
  liveDemoUrl: optionalUrlField('Live Demo').optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  category: z.enum(PROJECT_CATEGORIES).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  techStack: z.string().trim().optional(), // comma-separated, split in the service
  skills: z.string().trim().optional(), // comma-separated, split in the service
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
