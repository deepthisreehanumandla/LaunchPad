import { Schema, model, Document, Types } from 'mongoose';
import {
  PROJECT_CATEGORIES,
  PROJECT_PURPOSES,
  PROJECT_STATUSES,
  PROJECT_VISIBILITY,
} from '@shared/constants';

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type ProjectPurpose = (typeof PROJECT_PURPOSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectVisibility = (typeof PROJECT_VISIBILITY)[number];

export interface IProjectMemberRef {
  user: Types.ObjectId;
  role: 'creator' | 'member';
  joinedAt: Date;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: ProjectCategory;
  purpose: ProjectPurpose;
  techStack: string[];
  requiredSkills: string[];
  teamSize: number;
  deadline?: Date;
  bannerImage?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  creator: Types.ObjectId;
  members: IProjectMemberRef[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  progress: number;
  likesCount: number;
  bookmarksCount: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMemberRef>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['creator', 'member'], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 250 },
    detailedDescription: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: PROJECT_CATEGORIES, required: true },
    purpose: { type: String, enum: PROJECT_PURPOSES, required: true },
    techStack: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    teamSize: { type: Number, required: true, min: 1, max: 50 },
    deadline: { type: Date },
    bannerImage: { type: String, trim: true }, // external URL only — no uploads in V1
    githubUrl: { type: String, trim: true },
    liveDemoUrl: { type: String, trim: true },

    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [projectMemberSchema], default: [] },

    status: { type: String, enum: PROJECT_STATUSES, default: 'active' },
    visibility: {
      type: String,
      enum: PROJECT_VISIBILITY,
      default: function (this: IProject) {
        return this.purpose === 'team-formation' ? 'marketplace' : 'showcase-only';
      },
    },

    progress: { type: Number, default: 0, min: 0, max: 100 },
    likesCount: { type: Number, default: 0, min: 0 },
    bookmarksCount: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

projectSchema.index({ purpose: 1, category: 1, status: 1 });
projectSchema.index({ creator: 1 });
projectSchema.index(
  { title: 'text', shortDescription: 'text', techStack: 'text' },
  { name: 'project_search_index' },
);

export const Project = model<IProject>('Project', projectSchema);

/**
 * The minimal field set needed to render a ProjectCard on the frontend
 * (see client/components/project-card/ProjectCard.tsx). Shared by every
 * service that populates project summaries (bookmarks, a user's created/
 * contributed projects) so they can't silently drift out of sync with what
 * the card actually renders — which is exactly how `teamSize` previously
 * went missing from two independently-maintained copies of this list.
 */
export const PROJECT_CARD_SUMMARY_FIELDS =
  'title shortDescription category purpose techStack teamSize bannerImage status progress likesCount bookmarksCount creator';
