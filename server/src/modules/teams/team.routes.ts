import { Router } from 'express';
import { teamController } from './team.controller';
import {
  sendJoinRequestSchema,
  projectIdParamSchema,
  joinRequestParamSchema,
  memberParamSchema,
} from './team.validation';
import { authenticate } from '@middleware/authenticate';
import { requireProjectOwner } from '@middleware/requireProjectOwner';
import { validate } from '@middleware/validate';

const router = Router();

router.post(
  '/:id/join-requests',
  authenticate,
  validate({ params: projectIdParamSchema, body: sendJoinRequestSchema }),
  teamController.sendJoinRequest,
);

router.get(
  '/:id/join-requests',
  authenticate,
  validate({ params: projectIdParamSchema }),
  requireProjectOwner(),
  teamController.listPendingForProject,
);

router.patch(
  '/:id/join-requests/:reqId/accept',
  authenticate,
  validate({ params: joinRequestParamSchema }),
  requireProjectOwner(),
  teamController.acceptJoinRequest,
);

router.patch(
  '/:id/join-requests/:reqId/reject',
  authenticate,
  validate({ params: joinRequestParamSchema }),
  requireProjectOwner(),
  teamController.rejectJoinRequest,
);

router.get('/:id/members', validate({ params: projectIdParamSchema }), teamController.listMembers);

router.delete(
  '/:id/members/:userId',
  authenticate,
  validate({ params: memberParamSchema }),
  requireProjectOwner(),
  teamController.removeMember,
);

export default router;
