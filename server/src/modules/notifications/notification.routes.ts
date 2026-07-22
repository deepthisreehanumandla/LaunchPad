import { Router } from 'express';
import { notificationController } from './notification.controller';
import { notificationIdParamSchema, listNotificationsQuerySchema } from './notification.validation';
import { authenticate } from '@middleware/authenticate';
import { validate } from '@middleware/validate';

const router = Router();

router.use(authenticate); // every notification route is private to the logged-in user

router.get('/', validate({ query: listNotificationsQuerySchema }), notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validate({ params: notificationIdParamSchema }), notificationController.markAsRead);

export default router;
