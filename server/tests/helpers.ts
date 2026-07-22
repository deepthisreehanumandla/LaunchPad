import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();

interface RegisteredUser {
  agent: ReturnType<typeof request.agent>;
  accessToken: string;
  user: { _id: string; name: string; email: string };
}

let counter = 0;

export async function registerUser(overrides: Partial<{ name: string; email: string; password: string }> = {}): Promise<RegisteredUser> {
  counter += 1;
  const agent = request.agent(app);

  const payload = {
    name: overrides.name ?? `Test User ${counter}`,
    email: overrides.email ?? `test-user-${counter}@example.com`,
    password: overrides.password ?? 'Password123',
  };

  const response = await agent.post('/api/v1/auth/register').send(payload).expect(201);

  return {
    agent,
    accessToken: response.body.data.accessToken,
    user: response.body.data.user,
  };
}
