import { Router } from 'express';
import { activityController } from './activity.controller';
import { projectIdParamSchema, listActivityQuerySchema } from './activity.validation';
import { authenticate } from '@middleware/authenticate';
import { validate } from '@middleware/validate';

const router = Router();

router.get(
  '/:id/activity',
  authenticate,
  validate({ params: projectIdParamSchema, query: listActivityQuerySchema }),
  activityController.list,
);

export default router;
