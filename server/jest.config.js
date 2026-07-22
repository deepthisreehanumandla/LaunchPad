/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@sockets/(.*)$': '<rootDir>/src/sockets/$1',
    // Redis is mocked in tests so the suite never needs a real Redis instance.
    '^ioredis$': 'ioredis-mock',
  },
  testTimeout: 30000,
};
