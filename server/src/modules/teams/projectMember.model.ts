import { Schema, model, Document, Types } from 'mongoose';
import { PROJECT_MEMBER_ROLES } from '@shared/constants';

export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

export interface IProjectMember extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  user: Types.ObjectId;
  role: ProjectMemberRole;
  joinedAt: Date;
  leftAt?: Date;
}

const projectMemberSchema = new Schema<IProjectMember>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: PROJECT_MEMBER_ROLES, default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  // Soft-removal: kept instead of deleting the row so activity/contribution
  // history is preserved even after someone leaves or is removed.
  leftAt: { type: Date },
});

projectMemberSchema.index({ project: 1 });
projectMemberSchema.index({ user: 1 });
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMember = model<IProjectMember>('ProjectMember', projectMemberSchema);
