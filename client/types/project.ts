export type ProjectCategory =
  | 'startup'
  | 'hackathon'
  | 'final-year'
  | 'research'
  | 'open-source'
  | 'personal';

export type ProjectPurpose = 'team-formation' | 'personal-showcase';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type ProjectVisibility = 'marketplace' | 'private' | 'showcase-only';

export interface ProjectMemberRef {
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  role: 'creator' | 'member';
  joinedAt: string;
}

export interface ProjectCreatorRef {
  _id: string;
  name: string;
  profilePicture?: string;
  university?: string;
}

export interface Project {
  _id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: ProjectCategory;
  purpose: ProjectPurpose;
  techStack: string[];
  requiredSkills: string[];
  teamSize: number;
  deadline?: string;
  bannerImage?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  creator: ProjectCreatorRef | string;
  members: ProjectMemberRef[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  progress: number;
  likesCount: number;
  bookmarksCount: number;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: ProjectCategory;
  purpose: ProjectPurpose;
  techStack: string[];
  requiredSkills: string[];
  teamSize: number;
  deadline?: string;
  bannerImage?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface ListProjectsQuery {
  page?: number;
  limit?: number;
  category?: ProjectCategory;
  status?: ProjectStatus;
  search?: string;
  techStack?: string; // comma-separated
  skills?: string; // comma-separated
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
