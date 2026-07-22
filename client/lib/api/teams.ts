import { apiClient } from './client';
import type { JoinRequest, ProjectMember } from '@/types/team';

export const teamsApi = {
  sendJoinRequest: (projectId: string, message?: string) =>
    apiClient
      .post<{ joinRequest: JoinRequest }>(`/projects/${projectId}/join-requests`, { message })
      .then((r) => r.joinRequest),

  listPendingForProject: (projectId: string) =>
    apiClient
      .get<{ joinRequests: JoinRequest[] }>(`/projects/${projectId}/join-requests`)
      .then((r) => r.joinRequests),

  acceptJoinRequest: (projectId: string, joinRequestId: string) =>
    apiClient
      .patch<{ joinRequest: JoinRequest }>(`/projects/${projectId}/join-requests/${joinRequestId}/accept`)
      .then((r) => r.joinRequest),

  rejectJoinRequest: (projectId: string, joinRequestId: string) =>
    apiClient
      .patch<{ joinRequest: JoinRequest }>(`/projects/${projectId}/join-requests/${joinRequestId}/reject`)
      .then((r) => r.joinRequest),

  listMembers: (projectId: string) =>
    apiClient.get<{ members: ProjectMember[] }>(`/projects/${projectId}/members`, { skipAuth: true }).then(
      (r) => r.members,
    ),

  removeMember: (projectId: string, userId: string) =>
    apiClient.delete<{ removed: boolean }>(`/projects/${projectId}/members/${userId}`),
};
