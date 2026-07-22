import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, IUser } from '@modules/users/user.model';
import { RefreshToken } from '@modules/auth/refreshToken.model';
import { ApiError } from '@shared/utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@shared/utils/jwt';
import { addDuration } from '@shared/utils/duration';
import { env } from '@config/env';
import { RegisterInput, LoginInput } from './auth.validation';

const PASSWORD_SALT_ROUNDS = 12;

interface DeviceContext {
  userAgent?: string;
  ipAddress?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult extends AuthTokens {
  user: Pick<IUser, '_id' | 'name' | 'email'>;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

async function issueTokenPair(userId: Types.ObjectId, device: DeviceContext): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: userId.toString() });

  // Pre-generate the document id so it can be embedded as the refresh JWT's
  // `jti` claim *before* the RefreshToken document exists. This lets us create
  // the document in a single atomic write with `tokenHash` already computed,
  // instead of creating a placeholder row (tokenHash: '') and updating it
  // afterwards — which fails schema validation, since tokenHash is required.
  const refreshTokenId = new Types.ObjectId();

  const refreshToken = signRefreshToken({
    sub: userId.toString(),
    jti: refreshTokenId.toString(),
  });

  await RefreshToken.create({
    _id: refreshTokenId,
    user: userId,
    tokenHash: hashToken(refreshToken),
    userAgent: device.userAgent,
    ipAddress: device.ipAddress,
    expiresAt: addDuration(new Date(), env.JWT_REFRESH_EXPIRES_IN),
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput, device: DeviceContext): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

    let user;
    try {
      user = await User.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });
    } catch (err) {
      // The findOne check above is a best-effort pre-check, not a lock — two
      // concurrent registrations for the same email can both pass it and race
      // to create(). The unique index on User.email (see database.ts, which
      // now explicitly builds indexes on every boot) is the real guarantee;
      // this catches its violation and reports it the same way as the
      // pre-check, instead of leaking a raw MongoServerError as a 500.
      if (isDuplicateKeyError(err)) {
        throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
      }
      throw err;
    }

    const tokens = await issueTokenPair(user._id, device);

    return { ...tokens, user: { _id: user._id, name: user.name, email: user.email } };
  },

  async login(input: LoginInput, device: DeviceContext): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated', 'ACCOUNT_INACTIVE');
    }

    const tokens = await issueTokenPair(user._id, device);

    return { ...tokens, user: { _id: user._id, name: user.name, email: user.email } };
  },

  /**
   * Rotates a refresh token: verifies it, checks it hasn't been revoked,
   * revokes it, and issues a brand new access/refresh pair. If a revoked
   * token is presented (reuse), every token for that user is revoked and
   * an error is thrown, forcing re-authentication on all devices.
   */
  async refresh(refreshToken: string, device: DeviceContext): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    const tokenDoc = await RefreshToken.findById(payload.jti);
    const presentedHash = hashToken(refreshToken);

    if (!tokenDoc || tokenDoc.tokenHash !== presentedHash) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    if (tokenDoc.revokedAt) {
      // Reuse of a rotated-out token — treat as a possible theft and lock the account out.
      await RefreshToken.updateMany(
        { user: tokenDoc.user, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
      throw ApiError.unauthorized(
        'Refresh token reuse detected. Please log in again.',
        'REFRESH_TOKEN_REUSED',
      );
    }

    if (tokenDoc.expiresAt.getTime() < Date.now()) {
      throw ApiError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    tokenDoc.revokedAt = new Date();

    const newTokens = await issueTokenPair(tokenDoc.user, device);

    // Link old -> new for auditability, then persist the revocation.
    const newRefreshPayload = verifyRefreshToken(newTokens.refreshToken);
    tokenDoc.replacedByTokenId = new Types.ObjectId(newRefreshPayload.jti);
    await tokenDoc.save();

    return newTokens;
  },

  async logout(refreshToken: string): Promise<void> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return; // already invalid/expired — logout is idempotent
    }

    await RefreshToken.updateOne(
      { _id: payload.jti, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  },

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { user: userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  },
};
