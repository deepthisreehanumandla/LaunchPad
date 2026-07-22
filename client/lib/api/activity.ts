import { getWithPagination } from './client';
import type { Activity } from '@/types/activity';
import type { Pagination } from '@/types/project';

export const activityApi = {
  list: (projectId: string, page = 1, limit = 20): Promise<{ activities: Activity[]; pagination?: Pagination }> =>
    getWithPagination<{ activities: Activity[] }>(
      `/projects/${projectId}/activity?page=${page}&limit=${limit}`,
    ).then(({ data, pagination }) => ({ activities: data.activities, pagination })),
};
