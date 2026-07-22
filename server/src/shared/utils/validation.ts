import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Builds an optional-URL schema with a field-specific error message (e.g.
 * "Invalid GitHub URL" rather than a generic "Invalid URL"), so validation
 * failures always tell the user exactly which field is wrong. An empty
 * string is accepted so a field can be explicitly cleared from a form.
 */
export function optionalUrlField(label: string) {
  return z
    .string()
    .trim()
    .refine((val) => val === '' || /^https?:\/\/.+/.test(val), {
      message: `Invalid ${label} URL`,
    });
}
