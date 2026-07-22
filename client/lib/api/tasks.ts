import { apiClient } from './client';
import type { Task, CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '@/types/task';

export const tasksApi = {
  list: (projectId: string) =>
    apiClient.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`).then((r) => r.tasks),

  create: (projectId: string, input: CreateTaskInput) =>
    apiClient.post<{ task: Task }>(`/projects/${projectId}/tasks`, input).then((r) => r.task),

  update: (projectId: string, taskId: string, input: UpdateTaskInput) =>
    apiClient
      .patch<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}`, input)
      .then((r) => r.task),

  move: (projectId: string, taskId: string, input: MoveTaskInput) =>
    apiClient
      .patch<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}/move`, input)
      .then((r) => r.task),

  remove: (projectId: string, taskId: string) =>
    apiClient.delete<{ deleted: boolean }>(`/projects/${projectId}/tasks/${taskId}`),
};
