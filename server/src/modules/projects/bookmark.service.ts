import { Bookmark } from './bookmark.model';
import { Project, IProject, PROJECT_CARD_SUMMARY_FIELDS } from './project.model';
import { PUBLIC_USER_REF_FIELDS } from '@modules/users/user.model';
import { ApiError } from '@shared/utils/ApiError';

export const bookmarkService = {
  async toggle(userId: string, projectId: string): Promise<{ bookmarked: boolean }> {
    const project = await Project.findById(projectId).select('_id');
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const existing = await Bookmark.findOne({ user: userId, project: projectId });

    if (existing) {
      await existing.deleteOne();
      await Project.updateOne({ _id: projectId }, { $inc: { bookmarksCount: -1 } });
      return { bookmarked: false };
    }

    await Bookmark.create({ user: userId, project: projectId });
    await Project.updateOne({ _id: projectId }, { $inc: { bookmarksCount: 1 } });
    return { bookmarked: true };
  },

  async listForUser(userId: string) {
    const bookmarks = await Bookmark.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate<{ project: IProject }>({
        path: 'project',
        select: PROJECT_CARD_SUMMARY_FIELDS,
        populate: { path: 'creator', select: PUBLIC_USER_REF_FIELDS },
      });

    return bookmarks
      .filter((bookmark) => bookmark.project) // drop bookmarks whose project was deleted
      .map((bookmark) => ({
        // Every project returned by this endpoint is, by definition, bookmarked
        // by the requesting user — the frontend's ProjectCard reads this flag
        // to decide which star icon to render, so it must be set explicitly
        // here (it isn't a real field on Project, just computed per-viewer).
        ...bookmark.project.toObject(),
        isBookmarked: true,
      }));
  },

  async isBookmarkedByUser(userId: string, projectIds: string[]): Promise<Set<string>> {
    if (!userId) return new Set();
    const bookmarks = await Bookmark.find({ user: userId, project: { $in: projectIds } }).select('project');
    return new Set(bookmarks.map((b) => b.project.toString()));
  },
};
