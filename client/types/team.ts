export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface JoinRequestProjectRef {
  _id: string;
  title: string;
  bannerImage?: string;
  status?: string;
  purpose?: string;
}

export interface JoinRequestUserRef {
  _id: string;
  name: string;
  profilePicture?: string;
  university?: string;
}

export interface JoinRequest {
  _id: string;
  project: JoinRequestProjectRef | string;
  requester: JoinRequestUserRef | string;
  message?: string;
  status: JoinRequestStatus;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface ProjectMember {
  _id: string;
  project: string;
  user: JoinRequestUserRef;
  role: 'creator' | 'member';
  joinedAt: string;
  leftAt?: string;
}
