import { Router } from 'express';
import { taskController } from './task.controller';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  projectIdParamSchema,
  taskIdParamSchema,
} from './task.validation';
import { authenticate } from '@middleware/authenticate';
import { requireProjectOwner } from '@middleware/requireProjectOwner';
import { validate } from '@middleware/validate';

const router = Router();

router.get('/:id/tasks', authenticate, validate({ params: projectIdParamSchema }), taskController.list);

router.post(
  '/:id/tasks',
  authenticate,
  validate({ params: projectIdParamSchema, body: createTaskSchema }),
  taskController.create,
);

router.patch(
  '/:id/tasks/:taskId',
  authenticate,
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  taskController.update,
);

router.patch(
  '/:id/tasks/:taskId/move',
  authenticate,
  validate({ params: taskIdParamSchema, body: moveTaskSchema }),
  taskController.move,
);

router.delete(
  '/:id/tasks/:taskId',
  authenticate,
  validate({ params: taskIdParamSchema }),
  requireProjectOwner(),
  taskController.remove,
);

export default router;
