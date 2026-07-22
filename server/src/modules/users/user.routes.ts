import { Router } from 'express';
import { userController } from './user.controller';
import { updateProfileSchema, userIdParamSchema } from './user.validation';
import { authenticate } from '@middleware/authenticate';
import { optionalAuthenticate } from '@middleware/optionalAuthenticate';
import { validate } from '@middleware/validate';

const router = Router();

// Specific /me routes must be registered before the /:id param route,
// otherwise Express would try to treat "me" as an :id value.
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), userController.updateMe);
router.get('/me/bookmarks', authenticate, userController.getMyBookmarks);
router.get('/me/join-requests', authenticate, userController.getMyJoinRequests);

router.get('/:id', validate({ params: userIdParamSchema }), userController.getPublicProfile);
router.get(
  '/:id/projects',
  optionalAuthenticate,
  validate({ params: userIdParamSchema }),
  userController.getUserProjects,
);

export default router;
