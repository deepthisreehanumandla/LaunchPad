import { apiClient } from './client';
import type { UserProfile, UpdateProfileInput } from '@/types/user';
import type { Project } from '@/types/project';
import type { JoinRequest } from '@/types/team';

export const usersApi = {
  getMe: () => apiClient.get<{ user: UserProfile }>('/users/me').then((r) => r.user),

  updateMe: (input: UpdateProfileInput) =>
    apiClient.patch<{ user: UserProfile }>('/users/me', input).then((r) => r.user),

  getPublicProfile: (userId: string) =>
    apiClient
      .get<{ user: UserProfile }>(`/users/${userId}`, { skipAuth: true })
      .then((r) => r.user),

  getUserProjects: (userId: string) =>
    apiClient.get<{ created: Project[]; contributed: Project[] }>(`/users/${userId}/projects`, {
      skipAuth: true,
    }),

  getMyBookmarks: () =>
    apiClient.get<{ bookmarks: Project[] }>('/users/me/bookmarks').then((r) => r.bookmarks),

  getMyJoinRequests: () =>
    apiClient.get<{ sent: JoinRequest[] }>('/users/me/join-requests').then((r) => r.sent),
};
