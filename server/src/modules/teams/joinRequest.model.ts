import { Schema, model, Document, Types } from 'mongoose';
import { JOIN_REQUEST_STATUSES } from '@shared/constants';

export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUSES)[number];

export interface IJoinRequest extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  requester: Types.ObjectId;
  message?: string;
  status: JoinRequestStatus;
  respondedBy?: Types.ObjectId;
  respondedAt?: Date;
  createdAt: Date;
}

const joinRequestSchema = new Schema<IJoinRequest>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: JOIN_REQUEST_STATUSES, default: 'pending' },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Fast lookups: "pending requests for a project" (owner's inbox) and
// "my sent requests" (requester's own list).
joinRequestSchema.index({ project: 1, status: 1 });
joinRequestSchema.index({ requester: 1, status: 1 });

export const JoinRequest = model<IJoinRequest>('JoinRequest', joinRequestSchema);
