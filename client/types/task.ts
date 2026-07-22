export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskUserRef {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface Task {
  _id: string;
  project: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TaskUserRef;
  createdBy: TaskUserRef;
  dueDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignee?: string | null;
  status?: TaskStatus;
}

export interface MoveTaskInput {
  status: TaskStatus;
  order: number;
}

export interface TaskMovedPayload {
  _id: string;
  status: TaskStatus;
  order: number;
}
