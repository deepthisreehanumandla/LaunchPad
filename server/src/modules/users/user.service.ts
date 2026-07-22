import { User, IUser, PUBLIC_USER_REF_FIELDS } from './user.model';
import { Project, IProject, PROJECT_CARD_SUMMARY_FIELDS } from '@modules/projects/project.model';
import { bookmarkService } from '@modules/projects/bookmark.service';
import { ApiError } from '@shared/utils/ApiError';
import { UpdateProfileInput } from './user.validation';

function computeProfileCompletionScore(user: IUser): number {
  const fields = [
    Boolean(user.profilePicture),
    Boolean(user.university),
    Boolean(user.branch),
    Boolean(user.graduationYear),
    Boolean(user.bio),
    user.skills.length > 0,
    user.interests.length > 0,
    Boolean(user.socialLinks?.github || user.socialLinks?.linkedin || user.socialLinks?.portfolio),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export const userService = {
  async getById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.profilePicture !== undefined) user.profilePicture = input.profilePicture || undefined;
    if (input.university !== undefined) user.university = input.university;
    if (input.branch !== undefined) user.branch = input.branch;
    if (input.graduationYear !== undefined) user.graduationYear = input.graduationYear;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.skills !== undefined) user.skills = input.skills;
    if (input.interests !== undefined) user.interests = input.interests;
    if (input.socialLinks !== undefined) {
      user.socialLinks = {
        github: input.socialLinks.github || undefined,
        linkedin: input.socialLinks.linkedin || undefined,
        portfolio: input.socialLinks.portfolio || undefined,
      };
    }

    user.profileCompletionScore = computeProfileCompletionScore(user);

    await user.save();
    return user;
  },

  /**
   * Public profile view — deliberately excludes email and any account-internal
   * fields so it's safe to expose to any visitor, logged in or not.
   */
  async getPublicProfile(userId: string) {
    const user = await User.findById(userId).select(
      'name profilePicture university branch graduationYear bio skills interests socialLinks createdAt',
    );
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  },

  /**
   * A user's created and contributed projects, populated with just enough
   * fields to render project cards — used on the public profile page.
   * `viewerId` is optional (the profile page is public); when present, each
   * returned project is annotated with whether the *viewer* has bookmarked
   * it, matching the personalization already done on the marketplace and
   * project-details endpoints.
   */
  async getUserProjects(userId: string, viewerId?: string) {
    const user = await User.findById(userId)
      .select('createdProjects contributedProjects')
      .populate<{ createdProjects: IProject[] }>({
        path: 'createdProjects',
        select: PROJECT_CARD_SUMMARY_FIELDS,
        populate: { path: 'creator', select: PUBLIC_USER_REF_FIELDS },
      })
      .populate<{ contributedProjects: IProject[] }>({
        path: 'contributedProjects',
        select: PROJECT_CARD_SUMMARY_FIELDS,
        populate: { path: 'creator', select: PUBLIC_USER_REF_FIELDS },
      });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const allProjectIds = [...user.createdProjects, ...user.contributedProjects].map((p) =>
      p._id.toString(),
    );
    const bookmarkedIds = viewerId
      ? await bookmarkService.isBookmarkedByUser(viewerId, allProjectIds)
      : new Set<string>();

    const withBookmarkFlag = (projects: typeof user.createdProjects) =>
      projects.map((project) => ({
        ...project.toObject(),
        isBookmarked: bookmarkedIds.has(project._id.toString()),
      }));

    return {
      created: withBookmarkFlag(user.createdProjects),
      contributed: withBookmarkFlag(user.contributedProjects),
    };
  },
};

// Referenced so the Project model is registered before any populate() call
// in this module executes — avoids a "Schema hasn't been registered" error
// if this module is ever imported before modules/projects.
void Project;
