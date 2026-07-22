process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
// MONGODB_URI is overwritten per-test-run by tests/setup.ts once mongodb-memory-server
// has picked a free port, but env.ts requires it to be present at import time.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/launchpad-test';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-please-do-not-use-in-prod-32chars';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-please-do-not-use-in-prod-32chars';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.REFRESH_COOKIE_NAME = 'lp_refresh_token';
