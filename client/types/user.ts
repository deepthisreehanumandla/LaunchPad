export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email?: string; // only present on the "me" endpoint, never on public profiles
  profilePicture?: string;
  university?: string;
  branch?: string;
  graduationYear?: number;
  bio?: string;
  skills: string[];
  interests: string[];
  socialLinks: SocialLinks;
  createdProjects?: string[];
  contributedProjects?: string[];
  profileCompletionScore?: number;
  createdAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  profilePicture?: string;
  university?: string;
  branch?: string;
  graduationYear?: number;
  bio?: string;
  skills?: string[];
  interests?: string[];
  socialLinks?: SocialLinks;
}
