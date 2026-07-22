import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  profilePicture?: string;
  university?: string;
  branch?: string;
  graduationYear?: number;
  bio?: string;
  skills: string[];
  interests: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  createdProjects: Types.ObjectId[];
  contributedProjects: Types.ObjectId[];
  profileCompletionScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    profilePicture: { type: String, trim: true }, // external URL only — no uploads in V1
    university: { type: String, trim: true, maxlength: 150 },
    branch: { type: String, trim: true, maxlength: 100 },
    graduationYear: { type: Number, min: 1950, max: 2100 },
    bio: { type: String, trim: true, maxlength: 500 },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    socialLinks: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      portfolio: { type: String, trim: true },
    },
    createdProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    contributedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    profileCompletionScore: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ skills: 1 });

export const User = model<IUser>('User', userSchema);

/**
 * Minimal, safe-to-expose fields for a User referenced from another document
 * (e.g. a project's creator or a member entry). Deliberately excludes email
 * and any account-internal field. Shared so every populate() call that
 * references a user stays consistent instead of drifting per call site.
 */
export const PUBLIC_USER_REF_FIELDS = 'name profilePicture university';
