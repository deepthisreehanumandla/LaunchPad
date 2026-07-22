import 'express';
import type { IProject } from '@modules/projects/project.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
      // Attached by middleware/requireProjectOwner.ts once ownership has been
      // verified, so the downstream handler doesn't have to re-fetch it.
      project?: IProject;
    }
  }
}

export {};
