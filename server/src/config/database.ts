import mongoose from 'mongoose';
import { env, isProduction } from './env';

mongoose.set('strictQuery', true);

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    // autoIndex only controls *implicit* index builds on every connect; it's
    // disabled in production so a restart never silently kicks off a background
    // index build on a live collection. We still need the indexes to exist,
    // though — see the explicit build immediately below.
    autoIndex: !isProduction,
  });

  // Explicitly (and safely) ensure every registered model's indexes exist,
  // regardless of NODE_ENV. This is what actually creates the unique index on
  // User.email, the unique index on RefreshToken.tokenHash, and the TTL index
  // on RefreshToken.expiresAt — none of which would otherwise be created on a
  // production/Atlas deployment where autoIndex is off. Model.init() builds
  // indexes on demand and is safe to call on every boot: MongoDB no-ops on
  // indexes that already exist.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}
