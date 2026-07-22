import request from 'supertest';
import { app, registerUser } from './helpers';

describe('Auth', () => {
  it('registers a new user and returns an access token + user payload', async () => {
    const { user, accessToken } = await registerUser({ email: 'alice@example.com' });
    expect(user.email).toBe('alice@example.com');
    expect(typeof accessToken).toBe('string');
  });

  it('rejects registration with a duplicate email', async () => {
    await registerUser({ email: 'dup@example.com' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Dup User', email: 'dup@example.com', password: 'Password123' })
      .expect(409);

    expect(response.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('handles two concurrent registrations for the same email as a conflict, not a crash', async () => {
    const payload = { name: 'Racer', email: 'race@example.com', password: 'Password123' };

    // Fire both requests without awaiting the first — this is what actually
    // exercises the create()-level unique-index race, as opposed to the
    // sequential pre-check race covered by the test above.
    const [first, second] = await Promise.all([
      request(app).post('/api/v1/auth/register').send(payload),
      request(app).post('/api/v1/auth/register').send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const failed = first.status === 409 ? first : second;
    expect(failed.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects registration with a weak password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Weak Pw', email: 'weak@example.com', password: 'weak' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    await registerUser({ email: 'login@example.com', password: 'Password123' });

    const good = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'Password123' })
      .expect(200);
    expect(good.body.data.accessToken).toBeDefined();

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPassword1' })
      .expect(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('refreshes an access token using the httpOnly refresh cookie', async () => {
    const { agent } = await registerUser({ email: 'refresh@example.com' });

    const response = await agent.post('/api/v1/auth/refresh').expect(200);
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('rejects refresh with no cookie present', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').expect(401);
    expect(response.body.error.code).toBe('REFRESH_TOKEN_MISSING');
  });

  it('rejects reuse of a rotated-out refresh token and revokes the whole chain', async () => {
    const agent = request.agent(app);
    const registerResponse = await agent
      .post('/api/v1/auth/register')
      .send({ name: 'Reuse Test', email: 'reuse@example.com', password: 'Password123' })
      .expect(201);

    const originalCookie = extractCookie(registerResponse.headers['set-cookie']);

    // Rotate once via the agent (which automatically carries the original cookie
    // and will store the newly-issued one).
    const rotated = await agent.post('/api/v1/auth/refresh').expect(200);
    const rotatedCookie = extractCookie(rotated.headers['set-cookie']);
    expect(rotatedCookie).not.toEqual(originalCookie);

    // Replay the ORIGINAL (now-revoked) cookie directly — this must be rejected.
    const reuseAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(401);
    expect(reuseAttempt.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    // The rotated (previously valid) token must now be revoked too, since reuse
    // detection locks out the whole chain for that user.
    const rotatedNowRejected = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie)
      .expect(401);
    expect(rotatedNowRejected.body.error.code).toBe('REFRESH_TOKEN_REUSED');
  });

  it('logs out and invalidates the refresh cookie', async () => {
    const { agent } = await registerUser({ email: 'logout@example.com' });

    await agent.post('/api/v1/auth/logout').expect(200);

    const response = await agent.post('/api/v1/auth/refresh');
    expect(response.status).toBe(401);
  });
});

// supertest returns `set-cookie` as `string[] | undefined`; auth endpoints only
// ever set a single cookie, so pull that one entry out for reuse in later requests.
function extractCookie(setCookieHeader: string[] | undefined): string {
  if (!setCookieHeader || setCookieHeader.length === 0) {
    throw new Error('Expected a Set-Cookie header on the response');
  }
  return setCookieHeader[0];
}
