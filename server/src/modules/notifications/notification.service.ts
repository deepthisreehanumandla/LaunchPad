import { Types } from 'mongoose';
import { Notification, NotificationType } from './notification.model';
import { ApiError } from '@shared/utils/ApiError';
import { PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';
import { emitToUser } from '@sockets/io';

interface CreateNotificationInput {
  recipientId: string | Types.ObjectId;
  type: NotificationType;
  message: string;
  actorId?: string | Types.ObjectId;
  projectId?: string | Types.ObjectId;
  entityId?: string | Types.ObjectId;
}

export const notificationService = {
  /**
   * Persists a notification, then — once the write has succeeded — delivers
   * it in real time to every socket the recipient has open (see
   * sockets/io.ts's emitToUser). If the recipient isn't connected, or the
   * socket server hasn't been initialized (e.g. during tests), this is a
   * harmless no-op: they'll still see it next time they fetch /notifications.
   */
  async create(input: CreateNotificationInput): Promise<void> {
    const notification = await Notification.create({
      recipient: input.recipientId,
      type: input.type,
      message: input.message,
      actor: input.actorId,
      project: input.projectId,
      entityId: input.entityId,
    });

    const recipientId = input.recipientId.toString();

    const populated = await notification.populate([
      { path: 'actor', select: PUBLIC_USER_REF_FIELDS },
      { path: 'project', select: 'title' },
    ]);

    emitToUser(recipientId, 'notification:new', populated);

    const unreadCount = await notificationService.getUnreadCount(recipientId);
    emitToUser(recipientId, 'notification:unread-count', { count: unreadCount });
  },

  async listForUser(userId: string, page: number, limit: number) {
    const filter = { recipient: userId };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'actor', select: PUBLIC_USER_REF_FIELDS })
        .populate({ path: 'project', select: 'title' }),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ recipient: userId, read: false });
  },

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }
    if (notification.recipient.toString() !== userId) {
      throw ApiError.forbidden('You do not have access to this notification');
    }
    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
  },
};
