import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: Types.ObjectId; // set on rotation, supports reuse-detection
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByTokenId: { type: Schema.Types.ObjectId, ref: 'RefreshToken' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL index: MongoDB automatically deletes the document once expiresAt passes.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
