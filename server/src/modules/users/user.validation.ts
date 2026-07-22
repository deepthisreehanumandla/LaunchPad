import { z } from 'zod';
import { objectIdSchema, optionalUrlField } from '@shared/utils/validation';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
  profilePicture: optionalUrlField('Profile Picture').optional(),
  university: z.string().trim().max(150, 'University must be at most 150 characters').optional(),
  branch: z.string().trim().max(100, 'Branch must be at most 100 characters').optional(),
  graduationYear: z.coerce
    .number({ invalid_type_error: 'Graduation year must be a number' })
    .int('Graduation year must be a whole number')
    .min(1950, 'Graduation year must be 1950 or later')
    .max(2100, 'Graduation year must be 2100 or earlier')
    .optional(),
  bio: z.string().trim().max(500, 'Bio must be at most 500 characters').optional(),
  skills: z
    .array(z.string().trim().min(1, 'Skills cannot be empty').max(50, 'Each skill must be at most 50 characters'))
    .max(30, 'You can list at most 30 skills')
    .optional(),
  interests: z
    .array(z.string().trim().min(1, 'Interests cannot be empty').max(50, 'Each interest must be at most 50 characters'))
    .max(30, 'You can list at most 30 interests')
    .optional(),
  socialLinks: z
    .object({
      github: optionalUrlField('GitHub').optional(),
      linkedin: optionalUrlField('LinkedIn').optional(),
      portfolio: optionalUrlField('Portfolio').optional(),
    })
    .optional(),
});

export const userIdParamSchema = z.object({
  id: objectIdSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
