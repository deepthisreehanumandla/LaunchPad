import { Message } from './message.model';
import { PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';
import { teamService } from '@modules/teams/team.service';
import { ApiError } from '@shared/utils/ApiError';
import { SendMessageInput } from './message.validation';

export const messageService = {
  /** Throws 403 unless the user is an active member of the project. */
  async assertCanAccessChat(projectId: string, userId: string): Promise<void> {
    const isMember = await teamService.isActiveMember(projectId, userId);
    if (!isMember) {
      throw ApiError.forbidden('Only project members can access this project\u2019s chat');
    }
  },

  async listForProject(projectId: string, page: number, limit: number) {
    const filter = { project: projectId };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'sender', select: PUBLIC_USER_REF_FIELDS }),
      Message.countDocuments(filter),
    ]);

    return {
      // Reverse to chronological order (oldest first) for rendering, while
      // the query itself paginates from the newest message backward.
      messages: messages.reverse(),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  /**
   * Persists a message. The caller (REST controller or socket handler) is
   * responsible for broadcasting the real-time event — this function only
   * ever performs the database write, per the "emit only after a successful
   * DB operation" requirement.
   */
  async create(projectId: string, senderId: string, input: SendMessageInput) {
    const message = await Message.create({
      project: projectId,
      sender: senderId,
      content: input.content,
    });
    return message.populate({ path: 'sender', select: PUBLIC_USER_REF_FIELDS });
  },
};
