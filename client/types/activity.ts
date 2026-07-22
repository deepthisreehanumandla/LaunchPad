export type ActivityType =
  | 'task-created'
  | 'task-assigned'
  | 'task-status-changed'
  | 'task-completed';

export interface ActivityActorRef {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface Activity {
  _id: string;
  type: ActivityType;
  message: string;
  actor: ActivityActorRef;
  entityId?: string;
  createdAt: string;
}
