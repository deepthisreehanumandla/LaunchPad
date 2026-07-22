import { Router } from 'express';
import { messageController } from './message.controller';
import { projectIdParamSchema, listMessagesQuerySchema } from './message.validation';
import { authenticate } from '@middleware/authenticate';
import { validate } from '@middleware/validate';

const router = Router();

router.get(
  '/:id/messages',
  authenticate,
  validate({ params: projectIdParamSchema, query: listMessagesQuerySchema }),
  messageController.list,
);

export default router;
