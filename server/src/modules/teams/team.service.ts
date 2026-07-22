import { Types } from 'mongoose';
import { Project, IProject } from '@modules/projects/project.model';
import { User, PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';
import { JoinRequest } from './joinRequest.model';
import { ProjectMember } from './projectMember.model';
import { notificationService } from '@modules/notifications/notification.service';
import { ApiError } from '@shared/utils/ApiError';
import { SendJoinRequestInput } from './team.validation';

function isTeamFull(project: IProject): boolean {
  return project.members.length >= project.teamSize;
}

export const teamService = {
  async sendJoinRequest(projectId: string, requesterId: string, input: SendJoinRequestInput) {
    const project = await Project.findOne({ _id: projectId, deletedAt: { $exists: false } });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.purpose !== 'team-formation') {
      throw ApiError.badRequest(
        'This project is not looking for team members',
        'PROJECT_NOT_RECRUITING',
      );
    }

    if (project.creator.toString() === requesterId) {
      throw ApiError.badRequest('You cannot request to join your own project', 'OWN_PROJECT');
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === requesterId);
    if (alreadyMember) {
      throw ApiError.conflict('You are already a member of this project', 'ALREADY_MEMBER');
    }

    if (isTeamFull(project)) {
      throw ApiError.conflict('This project\u2019s team is already full', 'TEAM_FULL');
    }

    const existingPending = await JoinRequest.findOne({
      project: projectId,
      requester: requesterId,
      status: 'pending',
    });
    if (existingPending) {
      throw ApiError.conflict(
        'You already have a pending request for this project',
        'REQUEST_ALREADY_PENDING',
      );
    }

    const joinRequest = await JoinRequest.create({
      project: projectId,
      requester: requesterId,
      message: input.message,
      status: 'pending',
    });

    const requester = await User.findById(requesterId).select('name');
    await notificationService.create({
      recipientId: project.creator,
      type: 'join-request',
      message: `${requester?.name ?? 'A student'} requested to join "${project.title}"`,
      actorId: requesterId,
      projectId: project._id,
      entityId: joinRequest._id,
    });

    return joinRequest;
  },

  async listPendingForProject(projectId: string) {
    return JoinRequest.find({ project: projectId, status: 'pending' })
      .sort({ createdAt: -1 })
      .populate({ path: 'requester', select: PUBLIC_USER_REF_FIELDS });
  },

  async acceptJoinRequest(project: IProject, joinRequestId: string, responderId: string) {
    const joinRequest = await JoinRequest.findOne({ _id: joinRequestId, project: project._id });
    if (!joinRequest) {
      throw ApiError.notFound('Join request not found');
    }
    if (joinRequest.status !== 'pending') {
      throw ApiError.conflict('This request has already been responded to', 'ALREADY_RESPONDED');
    }
    if (isTeamFull(project)) {
      throw ApiError.conflict('Cannot accept \u2014 this project\u2019s team is already full', 'TEAM_FULL');
    }

    joinRequest.status = 'accepted';
    joinRequest.respondedBy = new Types.ObjectId(responderId);
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    project.members.push({
      user: joinRequest.requester,
      role: 'member',
      joinedAt: new Date(),
    });
    await project.save();

    // Reactivate a prior membership row if this person was a member before
    // (left/removed, then re-requested) instead of violating the unique
    // {project, user} index with a second insert.
    const existingMemberRow = await ProjectMember.findOne({
      project: project._id,
      user: joinRequest.requester,
    });
    if (existingMemberRow) {
      existingMemberRow.leftAt = undefined;
      existingMemberRow.joinedAt = new Date();
      await existingMemberRow.save();
    } else {
      await ProjectMember.create({
        project: project._id,
        user: joinRequest.requester,
        role: 'member',
        joinedAt: new Date(),
      });
    }

    await User.updateOne(
      { _id: joinRequest.requester },
      { $addToSet: { contributedProjects: project._id } },
    );

    await notificationService.create({
      recipientId: joinRequest.requester,
      type: 'request-accepted',
      message: `Your request to join "${project.title}" was accepted`,
      actorId: responderId,
      projectId: project._id,
      entityId: joinRequest._id,
    });

    return joinRequest;
  },

  async rejectJoinRequest(project: IProject, joinRequestId: string, responderId: string) {
    const joinRequest = await JoinRequest.findOne({ _id: joinRequestId, project: project._id });
    if (!joinRequest) {
      throw ApiError.notFound('Join request not found');
    }
    if (joinRequest.status !== 'pending') {
      throw ApiError.conflict('This request has already been responded to', 'ALREADY_RESPONDED');
    }

    joinRequest.status = 'rejected';
    joinRequest.respondedBy = new Types.ObjectId(responderId);
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    await notificationService.create({
      recipientId: joinRequest.requester,
      type: 'request-rejected',
      message: `Your request to join "${project.title}" was declined`,
      actorId: responderId,
      projectId: project._id,
      entityId: joinRequest._id,
    });

    return joinRequest;
  },

  async listMembers(projectId: string) {
    return ProjectMember.find({ project: projectId, leftAt: { $exists: false } })
      .sort({ joinedAt: 1 })
      .populate({ path: 'user', select: PUBLIC_USER_REF_FIELDS });
  },

  async removeMember(project: IProject, memberUserId: string) {
    if (project.creator.toString() === memberUserId) {
      throw ApiError.badRequest('The project creator cannot be removed', 'CANNOT_REMOVE_CREATOR');
    }

    const memberRow = await ProjectMember.findOne({
      project: project._id,
      user: memberUserId,
      leftAt: { $exists: false },
    });
    if (!memberRow) {
      throw ApiError.notFound('This user is not an active member of this project');
    }

    memberRow.leftAt = new Date();
    await memberRow.save();

    project.members = project.members.filter((m) => m.user.toString() !== memberUserId);
    await project.save();

    // contributedProjects is intentionally left untouched — it's a historical
    // record of past contributions, not a live membership list.
  },

  async getMyJoinRequests(userId: string) {
    const sent = await JoinRequest.find({ requester: userId })
      .sort({ createdAt: -1 })
      .populate({ path: 'project', select: 'title bannerImage status purpose' });
    return { sent };
  },

  /**
   * Whether a user is currently an active member of a project (creator or
   * accepted member, not previously removed). Added in Phase 4 so the new
   * chat module can authorize access without duplicating the membership
   * check — the project creator is always considered a member even before
   * any ProjectMember row exists for edge cases like a brand-new project.
   */
  async isActiveMember(projectId: string, userId: string): Promise<boolean> {
    const project = await Project.findOne({ _id: projectId, deletedAt: { $exists: false } }).select(
      'creator',
    );
    if (!project) return false;
    if (project.creator.toString() === userId) return true;

    const membership = await ProjectMember.findOne({
      project: projectId,
      user: userId,
      leftAt: { $exists: false },
    });
    return Boolean(membership);
  },
};
