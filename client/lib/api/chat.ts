import { getWithPagination } from './client';
import type { Pagination } from '@/types/project';
import type { ChatMessage } from '@/types/chat';

export const chatApi = {
  listMessages: (
    projectId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: ChatMessage[]; pagination?: Pagination }> =>
    getWithPagination<{ messages: ChatMessage[] }>(
      `/projects/${projectId}/messages?page=${page}&limit=${limit}`,
    ).then(({ data, pagination }) => ({ messages: data.messages, pagination })),
};
