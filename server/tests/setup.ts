import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { redisClient } from '@config/redis';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // By this point every module under test (via tests/helpers.ts -> src/app.ts)
  // has already registered its Mongoose models. Explicitly wait for their
  // indexes — including Project's text index — to finish building, so tests
  // that rely on $text search or unique constraints aren't racing background
  // index creation.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

  // ioredis-mock (see jest.config.js moduleNameMapper) resolves connect()
  // immediately; this mirrors what server.ts does at real boot time.
  await redisClient.connect().catch(() => undefined);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  await redisClient.flushall().catch(() => undefined);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  redisClient.disconnect();
});
