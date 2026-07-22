import { Schema, model, Document, Types } from 'mongoose';

export const ACTIVITY_TYPES = [
  'task-created',
  'task-assigned',
  'task-status-changed',
  'task-completed',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface IActivity extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  actor: Types.ObjectId;
  type: ActivityType;
  message: string;
  entityId?: Types.ObjectId;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    entityId: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ project: 1, createdAt: -1 });

export const Activity = model<IActivity>('Activity', activitySchema);
