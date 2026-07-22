import { Schema, model, Document, Types } from 'mongoose';
import { NOTIFICATION_TYPES } from '@shared/constants';

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  actor?: Types.ObjectId;
  project?: Types.ObjectId;
  entityId?: Types.ObjectId;
  message: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    entityId: { type: Schema.Types.ObjectId },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Powers both the notification feed and the unread-count badge.
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
