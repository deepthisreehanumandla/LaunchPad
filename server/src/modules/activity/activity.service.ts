import { Types } from 'mongoose';
import { Activity, ActivityType } from './activity.model';
import { PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';

interface LogActivityInput {
  projectId: string | Types.ObjectId;
  actorId: string | Types.ObjectId;
  type: ActivityType;
  message: string;
  entityId?: string | Types.ObjectId;
}

export const activityService = {
  async log(input: LogActivityInput): Promise<void> {
    await Activity.create({
      project: input.projectId,
      actor: input.actorId,
      type: input.type,
      message: input.message,
      entityId: input.entityId,
    });
  },

  async listForProject(projectId: string, page: number, limit: number) {
    const filter = { project: projectId };

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'actor', select: PUBLIC_USER_REF_FIELDS }),
      Activity.countDocuments(filter),
    ]);

    return {
      activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },
};
