import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '@shared/utils/ApiError';

interface ValidationSchemas {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}

/**
 * Validates req.body / req.params / req.query against the given Zod schemas
 * and replaces each with its parsed (and thus type-coerced, unknown-key-stripped)
 * result. Unknown fields never reach the service layer.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', err.flatten().fieldErrors),
        );
      }
      next(err);
    }
  };
}
