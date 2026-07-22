import { NextFunction, Request, Response } from 'express';
import { Project } from '@modules/projects/project.model';
import { ApiError } from '@shared/utils/ApiError';

/**
 * Requires the authenticated user to be the project's creator. Expects the
 * project id at `req.params.id` (matches every `/projects/:id/...` route).
 * Attaches the loaded project to `req.project` so the downstream handler
 * doesn't have to fetch it again.
 */
export function requireProjectOwner() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const project = await Project.findOne({ _id: req.params.id, deletedAt: { $exists: false } });
      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      if (project.creator.toString() !== req.user.id) {
        throw ApiError.forbidden('Only the project owner can perform this action');
      }

      req.project = project;
      next();
    } catch (err) {
      next(err);
    }
  };
}
