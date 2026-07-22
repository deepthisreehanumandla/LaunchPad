import { Types } from 'mongoose';
import { Task } from './task.model';
import { Project, IProject } from '@modules/projects/project.model';
import { User, PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';
import { teamService } from '@modules/teams/team.service';
import { activityService } from '@modules/activity/activity.service';
import { emitToProject } from '@sockets/io';
import { ApiError } from '@shared/utils/ApiError';
import { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from './task.validation';

const ASSIGNEE_POPULATE = { path: 'assignee', select: PUBLIC_USER_REF_FIELDS };
const CREATOR_POPULATE = { path: 'createdBy', select: PUBLIC_USER_REF_FIELDS };

async function loadActiveProject(projectId: string): Promise<IProject> {
  const project = await Project.findOne({ _id: projectId, deletedAt: { $exists: false } });
  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

async function assertIsActiveMember(projectId: string, userId: string): Promise<void> {
  const isMember = await teamService.isActiveMember(projectId, userId);
  if (!isMember) {
    throw ApiError.forbidden('Only active project members can access the task board');
  }
}

async function assertValidAssignee(projectId: string, assigneeId: string): Promise<void> {
  const isMember = await teamService.isActiveMember(projectId, assigneeId);
  if (!isMember) {
    throw ApiError.badRequest(
      'Only active project members can be assigned to tasks',
      'INVALID_ASSIGNEE',
    );
  }
}

function isOwner(project: IProject, userId: string): boolean {
  return project.creator.toString() === userId;
}

export const taskService = {
  async list(projectId: string, requesterId: string) {
    await assertIsActiveMember(projectId, requesterId);

    return Task.find({ project: projectId })
      .sort({ status: 1, order: 1 })
      .populate(ASSIGNEE_POPULATE)
      .populate(CREATOR_POPULATE);
  },

  async create(projectId: string, requesterId: string, input: CreateTaskInput) {
    await assertIsActiveMember(projectId, requesterId);

    if (input.assignee) {
      await assertValidAssignee(projectId, input.assignee);
    }

    const status = input.status ?? 'todo';
    const existingInColumn = await Task.countDocuments({ project: projectId, status });

    const task = await Task.create({
      project: projectId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      assignee: input.assignee,
      status,
      order: existingInColumn,
      createdBy: requesterId,
    });

    const creator = await User.findById(requesterId).select('name');
    await activityService.log({
      projectId,
      actorId: requesterId,
      type: 'task-created',
      message: `${creator?.name ?? 'Someone'} created task "${task.title}"`,
      entityId: task._id,
    });

    if (input.assignee) {
      const assignee = await User.findById(input.assignee).select('name');
      await activityService.log({
        projectId,
        actorId: requesterId,
        type: 'task-assigned',
        message: `${assignee?.name ?? 'Someone'} was assigned to "${task.title}"`,
        entityId: task._id,
      });
    }

    const populated = await task.populate([ASSIGNEE_POPULATE, CREATOR_POPULATE]);
    emitToProject(projectId, 'task:created', populated);
    return populated;
  },

  /**
   * Full field edit (title/description/priority/dueDate/assignee/status).
   * Owner: any task, any field. Member: only a task assigned to themselves,
   * and never the `assignee` field — per the approved permission model.
   */
  async update(projectId: string, taskId: string, requesterId: string, input: UpdateTaskInput) {
    const project = await loadActiveProject(projectId);
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const ownerRequest = isOwner(project, requesterId);

    if (!ownerRequest) {
      if (!task.assignee || task.assignee.toString() !== requesterId) {
        throw ApiError.forbidden('You can only edit tasks assigned to you');
      }
      if (Object.prototype.hasOwnProperty.call(input, 'assignee')) {
        throw ApiError.forbidden('Only the project owner can assign or reassign tasks');
      }
    }

    if (Object.prototype.hasOwnProperty.call(input, 'assignee') && input.assignee) {
      await assertValidAssignee(projectId, input.assignee);
    }

    const previousStatus = task.status;
    const previousAssignee = task.assignee?.toString();

    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description;
    if (input.priority !== undefined) task.priority = input.priority;
    if (input.dueDate !== undefined) task.dueDate = input.dueDate ?? undefined;
    if (input.status !== undefined) task.status = input.status;
    if (Object.prototype.hasOwnProperty.call(input, 'assignee')) {
      task.assignee = input.assignee ? new Types.ObjectId(input.assignee) : undefined;
    }

    await task.save();

    const actor = await User.findById(requesterId).select('name');

    if (Object.prototype.hasOwnProperty.call(input, 'assignee') && input.assignee !== previousAssignee) {
      const assigneeUser = input.assignee ? await User.findById(input.assignee).select('name') : null;
      await activityService.log({
        projectId,
        actorId: requesterId,
        type: 'task-assigned',
        message: assigneeUser
          ? `${assigneeUser.name} was assigned to "${task.title}"`
          : `${actor?.name ?? 'Someone'} unassigned "${task.title}"`,
        entityId: task._id,
      });
    }

    if (input.status !== undefined && input.status !== previousStatus) {
      await activityService.log({
        projectId,
        actorId: requesterId,
        type: 'task-status-changed',
        message: `${actor?.name ?? 'Someone'} moved "${task.title}" to ${input.status}`,
        entityId: task._id,
      });

      if (input.status === 'done') {
        await activityService.log({
          projectId,
          actorId: requesterId,
          type: 'task-completed',
          message: `${actor?.name ?? 'Someone'} completed "${task.title}"`,
          entityId: task._id,
        });
      }
    }

    const populated = await task.populate([ASSIGNEE_POPULATE, CREATOR_POPULATE]);
    emitToProject(projectId, 'task:updated', populated);
    return populated;
  },

  /**
   * Status/order-only update used by drag-and-drop. Same ownership rule as
   * a full edit (owner: any task; member: only their own assigned task),
   * but never touches `assignee`, so it doesn't need the reassignment check.
   */
  async move(projectId: string, taskId: string, requesterId: string, input: MoveTaskInput) {
    const project = await loadActiveProject(projectId);
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    const ownerRequest = isOwner(project, requesterId);
    if (!ownerRequest && (!task.assignee || task.assignee.toString() !== requesterId)) {
      throw ApiError.forbidden('You can only move tasks assigned to you');
    }

    const previousStatus = task.status;
    task.status = input.status;
    task.order = input.order;
    await task.save();

    if (input.status !== previousStatus) {
      const actor = await User.findById(requesterId).select('name');
      await activityService.log({
        projectId,
        actorId: requesterId,
        type: 'task-status-changed',
        message: `${actor?.name ?? 'Someone'} moved "${task.title}" to ${input.status}`,
        entityId: task._id,
      });

      if (input.status === 'done') {
        await activityService.log({
          projectId,
          actorId: requesterId,
          type: 'task-completed',
          message: `${actor?.name ?? 'Someone'} completed "${task.title}"`,
          entityId: task._id,
        });
      }
    }

    const populated = await task.populate([ASSIGNEE_POPULATE, CREATOR_POPULATE]);
    emitToProject(projectId, 'task:moved', {
      _id: populated._id,
      status: populated.status,
      order: populated.order,
    });
    return populated;
  },

  /** Deletion is owner-only, enforced by requireProjectOwner at the route level. */
  async remove(projectId: string, taskId: string): Promise<void> {
    const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });
    if (!task) {
      throw ApiError.notFound('Task not found');
    }
    emitToProject(projectId, 'task:deleted', { _id: task._id });
  },
};
