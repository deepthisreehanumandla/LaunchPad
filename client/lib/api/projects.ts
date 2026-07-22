import { apiClient, getWithPagination } from './client';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
  Pagination,
} from '@/types/project';

function buildQueryString(query: ListProjectsQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const projectsApi = {
  create: (input: CreateProjectInput) =>
    apiClient.post<{ project: Project }>('/projects', input).then((r) => r.project),

  list: (query: ListProjectsQuery = {}): Promise<{ projects: Project[]; pagination?: Pagination }> =>
    getWithPagination<{ projects: Project[] }>(`/projects${buildQueryString(query)}`, {
      skipAuth: true,
    }).then(({ data, pagination }) => ({ projects: data.projects, pagination })),

  getById: (projectId: string) =>
    apiClient
      .get<{ project: Project }>(`/projects/${projectId}`, { skipAuth: true })
      .then((r) => r.project),

  update: (projectId: string, input: UpdateProjectInput) =>
    apiClient.patch<{ project: Project }>(`/projects/${projectId}`, input).then((r) => r.project),

  remove: (projectId: string) => apiClient.delete<{ deleted: boolean }>(`/projects/${projectId}`),

  toggleBookmark: (projectId: string) =>
    apiClient.post<{ bookmarked: boolean }>(`/projects/${projectId}/bookmark`),
};
