import request from 'supertest';
import { app, registerUser } from './helpers';

describe('Users', () => {
  it('returns the current user via GET /users/me', async () => {
    const { agent, user, accessToken } = await registerUser();

    const response = await agent
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.user._id).toBe(user._id);
  });

  it('rejects GET /users/me with no access token', async () => {
    await request(app).get('/api/v1/users/me').expect(401);
  });

  it('updates the current user profile', async () => {
    const { agent, accessToken } = await registerUser();

    const response = await agent
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bio: 'I build things.',
        skills: ['React', 'Node.js'],
        interests: ['Open Source'],
        socialLinks: { github: 'https://github.com/example' },
      })
      .expect(200);

    expect(response.body.data.user.bio).toBe('I build things.');
    expect(response.body.data.user.skills).toEqual(['React', 'Node.js']);
    expect(response.body.data.user.socialLinks.github).toBe('https://github.com/example');
    expect(response.body.data.user.profileCompletionScore).toBeGreaterThan(0);
  });

  it('rejects an invalid URL in socialLinks', async () => {
    const { agent, accessToken } = await registerUser();

    const response = await agent
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ socialLinks: { github: 'not-a-url' } })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('serves a public profile without requiring authentication', async () => {
    const { user, agent, accessToken } = await registerUser();
    await agent
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ skills: ['Python'] })
      .expect(200);

    const response = await request(app).get(`/api/v1/users/${user._id}`).expect(200);

    expect(response.body.data.user.name).toBe(user.name);
    expect(response.body.data.user.skills).toEqual(['Python']);
    expect(response.body.data.user.email).toBeUndefined(); // public profile must not leak email
  });

  it('returns 404 for a non-existent user id', async () => {
    const response = await request(app)
      .get('/api/v1/users/64b64b64b64b64b64b64b64b')
      .expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it("lists a user's created projects", async () => {
    const { agent, accessToken, user } = await registerUser();

    await agent
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'My Project',
        shortDescription: 'A short description of the project',
        detailedDescription: 'A longer, detailed description of the project and its goals.',
        category: 'startup',
        purpose: 'team-formation',
        techStack: ['React'],
        requiredSkills: ['Design'],
        teamSize: 4,
      })
      .expect(201);

    const response = await request(app).get(`/api/v1/users/${user._id}/projects`).expect(200);

    expect(response.body.data.created).toHaveLength(1);
    expect(response.body.data.created[0].title).toBe('My Project');
    expect(response.body.data.created[0].teamSize).toBe(4);
    expect(response.body.data.created[0].isBookmarked).toBe(false); // anonymous viewer
    expect(response.body.data.contributed).toHaveLength(0);
  });

  it("personalizes isBookmarked on a profile's projects for a logged-in viewer", async () => {
    const owner = await registerUser();
    const viewer = await registerUser();

    const createResponse = await owner.agent
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Bookmark Me',
        shortDescription: 'A short description of the project',
        detailedDescription: 'A longer, detailed description of the project and its goals.',
        category: 'startup',
        purpose: 'team-formation',
        techStack: ['React'],
        requiredSkills: ['Design'],
        teamSize: 3,
      })
      .expect(201);
    const projectId = createResponse.body.data.project._id;

    await viewer.agent
      .post(`/api/v1/projects/${projectId}/bookmark`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const asViewer = await viewer.agent
      .get(`/api/v1/users/${owner.user._id}/projects`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(asViewer.body.data.created[0].isBookmarked).toBe(true);

    const anonymous = await request(app).get(`/api/v1/users/${owner.user._id}/projects`).expect(200);
    expect(anonymous.body.data.created[0].isBookmarked).toBe(false);
  });
});
