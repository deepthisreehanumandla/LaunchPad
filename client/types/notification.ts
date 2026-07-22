export type NotificationType = 'join-request' | 'request-accepted' | 'request-rejected';

export interface NotificationActorRef {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface NotificationProjectRef {
  _id: string;
  title: string;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  actor?: NotificationActorRef;
  project?: NotificationProjectRef;
  entityId?: string;
  read: boolean;
  createdAt: string;
}
