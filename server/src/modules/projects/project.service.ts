import { FilterQuery } from 'mongoose';
import { Project, IProject } from './project.model';
import { Bookmark } from './bookmark.model';
import { User, PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';
import { ProjectMember } from '@modules/teams/projectMember.model';
import { JoinRequest } from '@modules/teams/joinRequest.model';
import { Task } from '@modules/tasks/task.model';
import { Message } from '@modules/chat/message.model';
import { Activity } from '@modules/activity/activity.model';
import { Notification } from '@modules/notifications/notification.model';
import { bookmarkService } from './bookmark.service';
import { ApiError } from '@shared/utils/ApiError';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from './project.validation';

function splitCommaList(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const projectService = {
  async create(creatorId: string, input: CreateProjectInput): Promise<IProject> {
    const project = await Project.create({
      ...input,
      creator: creatorId,
      members: [{ user: creatorId, role: 'creator', joinedAt: new Date() }],
    });

    await User.updateOne({ _id: creatorId }, { $addToSet: { createdProjects: project._id } });

    return project;
  },

  async getById(projectId: string, viewerId?: string) {
    const project = await Project.findOne({ _id: projectId, deletedAt: { $exists: false } })
      .populate({ path: 'creator', select: PUBLIC_USER_REF_FIELDS })
      .populate({ path: 'members.user', select: PUBLIC_USER_REF_FIELDS });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    let isBookmarked = false;
    if (viewerId) {
      const bookmarked = await bookmarkService.isBookmarkedByUser(viewerId, [projectId]);
      isBookmarked = bookmarked.has(projectId);
    }

    return { ...project.toObject(), isBookmarked };
  },

  async update(projectId: string, requesterId: string, input: UpdateProjectInput): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, deletedAt: { $exists: false } });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.creator.toString() !== requesterId) {
      throw ApiError.forbidden('Only the project creator can edit this project');
    }

    Object.assign(project, input);
    await project.save();
    return project;
  },

  /**
   * Permanently deletes the project and cleans up every reference to it —
   * the creator's `createdProjects`, every member's `contributedProjects`,
   * and all related collections (bookmarks, membership rows, join requests,
   * tasks, chat messages, activity log entries, notifications). This was
   * previously a soft-delete (archive), which left the document in the
   * database and, critically, never removed it from `createdProjects` —
   * so it kept showing up on the creator's profile. Deletion is now a real
   * delete, matching what "Delete Project" is expected to do.
   */
  async remove(projectId: string, requesterId: string): Promise<void> {
    const project = await Project.findOne({ _id: projectId, deletedAt: { $exists: false } });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.creator.toString() !== requesterId) {
      throw ApiError.forbidden('Only the project creator can delete this project');
    }

    const memberIds = project.members.map((m) => m.user);

    await Promise.all([
      Project.deleteOne({ _id: projectId }),
      User.updateOne({ _id: project.creator }, { $pull: { createdProjects: projectId } }),
      memberIds.length > 0
        ? User.updateMany({ _id: { $in: memberIds } }, { $pull: { contributedProjects: projectId } })
        : Promise.resolve(),
      Bookmark.deleteMany({ project: projectId }),
      ProjectMember.deleteMany({ project: projectId }),
      JoinRequest.deleteMany({ project: projectId }),
      Task.deleteMany({ project: projectId }),
      Message.deleteMany({ project: projectId }),
      Activity.deleteMany({ project: projectId }),
      Notification.deleteMany({ project: projectId }),
    ]);
  },

  async list(query: ListProjectsQuery, viewerId?: string) {
    const { page, limit, category, status, search } = query;
    const techStack = splitCommaList(query.techStack);
    const skills = splitCommaList(query.skills);

    const filter: FilterQuery<IProject> = {
      deletedAt: { $exists: false },
      // The marketplace only surfaces projects actively recruiting teammates —
      // personal-showcase projects live on the creator's profile instead
      // (see business rules in the design doc §"Business Rules" item 6).
      purpose: 'team-formation',
      visibility: 'marketplace',
    };

    if (category) filter.category = category;
    filter.status = status ?? 'active';
    if (techStack?.length) filter.techStack = { $in: techStack };
    if (skills?.length) filter.requiredSkills = { $in: skills };
    if (search) filter.$text = { $search: search };

    const [projects, total] = await Promise.all([
      Project.find(filter, search ? { score: { $meta: 'textScore' } } : undefined)
        .populate({ path: 'creator', select: PUBLIC_USER_REF_FIELDS })
        .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    let bookmarkedIds = new Set<string>();
    if (viewerId && projects.length) {
      bookmarkedIds = await bookmarkService.isBookmarkedByUser(
        viewerId,
        projects.map((p) => p._id.toString()),
      );
    }

    return {
      projects: projects.map((project) => ({
        ...project.toObject(),
        isBookmarked: bookmarkedIds.has(project._id.toString()),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};
