import { apiClient, getWithPagination } from './client';
import type { Notification } from '@/types/notification';
import type { Pagination } from '@/types/project';

export const notificationsApi = {
  list: (page = 1, limit = 20): Promise<{ notifications: Notification[]; pagination?: Pagination }> =>
    getWithPagination<{ notifications: Notification[] }>(
      `/notifications?page=${page}&limit=${limit}`,
    ).then(({ data, pagination }) => ({ notifications: data.notifications, pagination })),

  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.count),

  markAsRead: (notificationId: string) =>
    apiClient.patch<{ read: boolean }>(`/notifications/${notificationId}/read`),

  markAllAsRead: () => apiClient.patch<{ read: boolean }>('/notifications/read-all'),
};
