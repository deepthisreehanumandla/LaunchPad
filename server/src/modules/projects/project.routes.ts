import { Router } from 'express';
import { projectController } from './project.controller';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  listProjectsQuerySchema,
} from './project.validation';
import { authenticate } from '@middleware/authenticate';
import { optionalAuthenticate } from '@middleware/optionalAuthenticate';
import { validate } from '@middleware/validate';

const router = Router();

router.post('/', authenticate, validate({ body: createProjectSchema }), projectController.create);

router.get('/', optionalAuthenticate, validate({ query: listProjectsQuerySchema }), projectController.list);

router.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: projectIdParamSchema }),
  projectController.getById,
);

router.patch(
  '/:id',
  authenticate,
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  projectController.update,
);

router.delete(
  '/:id',
  authenticate,
  validate({ params: projectIdParamSchema }),
  projectController.remove,
);

router.post(
  '/:id/bookmark',
  authenticate,
  validate({ params: projectIdParamSchema }),
  projectController.toggleBookmark,
);

export default router;
