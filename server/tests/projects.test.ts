import request from 'supertest';
import { app, registerUser } from './helpers';

const baseProjectPayload = {
  title: 'LaunchPad Mobile App',
  shortDescription: 'A mobile client for the LaunchPad platform',
  detailedDescription: 'We are building a React Native client so students can collaborate on the go.',
  category: 'startup' as const,
  purpose: 'team-formation' as const,
  techStack: ['React Native', 'TypeScript'],
  requiredSkills: ['Mobile Development', 'UI Design'],
  teamSize: 5,
};

async function createProject(
  agent: ReturnType<typeof request.agent>,
  accessToken: string,
  overrides: Partial<typeof baseProjectPayload> = {},
) {
  const response = await agent
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ ...baseProjectPayload, ...overrides })
    .expect(201);
  return response.body.data.project;
}

describe('Projects', () => {
  it('creates a project and adds the creator as a member', async () => {
    const { agent, accessToken, user } = await registerUser();

    const project = await createProject(agent, accessToken);

    expect(project.title).toBe(baseProjectPayload.title);
    expect(project.creator._id ?? project.creator).toBe(user._id);
    expect(project.members).toHaveLength(1);
    expect(project.members[0].role).toBe('creator');
    expect(project.visibility).toBe('marketplace'); // default for team-formation purpose
  });

  it('defaults personal-showcase projects to showcase-only visibility', async () => {
    const { agent, accessToken } = await registerUser();

    const project = await createProject(agent, accessToken, {
      purpose: 'personal-showcase',
      requiredSkills: [],
    });

    expect(project.visibility).toBe('showcase-only');
  });

  it('rejects project creation with an invalid category', async () => {
    const { agent, accessToken } = await registerUser();

    const response = await agent
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...baseProjectPayload, category: 'not-a-real-category' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects project creation without authentication', async () => {
    await request(app).post('/api/v1/projects').send(baseProjectPayload).expect(401);
  });

  it('fetches a single project by id, unauthenticated', async () => {
    const { agent, accessToken } = await registerUser();
    const project = await createProject(agent, accessToken);

    const response = await request(app).get(`/api/v1/projects/${project._id}`).expect(200);
    expect(response.body.data.project.title).toBe(baseProjectPayload.title);
    expect(response.body.data.project.isBookmarked).toBe(false);
  });

  it('returns 404 for a non-existent project id', async () => {
    await request(app).get('/api/v1/projects/64b64b64b64b64b64b64b64b').expect(404);
  });

  it('only allows the creator to edit a project', async () => {
    const owner = await registerUser();
    const outsider = await registerUser();

    const project = await createProject(owner.agent, owner.accessToken);

    const forbidden = await outsider.agent
      .patch(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ title: 'Hijacked Title' })
      .expect(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');

    const allowed = await owner.agent
      .patch(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);
    expect(allowed.body.data.project.title).toBe('Updated Title');
  });

  it('only allows the creator to archive (delete) a project', async () => {
    const owner = await registerUser();
    const outsider = await registerUser();
    const project = await createProject(owner.agent, owner.accessToken);

    await outsider.agent
      .delete(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);

    await owner.agent
      .delete(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    // Archived projects are excluded from the public "get by id" view.
    await request(app).get(`/api/v1/projects/${project._id}`).expect(404);
  });

  it('lists only marketplace (team-formation) projects by default', async () => {
    const { agent, accessToken } = await registerUser();

    await createProject(agent, accessToken, { title: 'Team Project' });
    await createProject(agent, accessToken, {
      title: 'Solo Showcase',
      purpose: 'personal-showcase',
      requiredSkills: [],
    });

    const response = await request(app).get('/api/v1/projects').expect(200);
    const titles = response.body.data.projects.map((p: { title: string }) => p.title);

    expect(titles).toContain('Team Project');
    expect(titles).not.toContain('Solo Showcase');
  });

  it('filters projects by category', async () => {
    const { agent, accessToken } = await registerUser();
    await createProject(agent, accessToken, { title: 'Startup Idea', category: 'startup' });
    await createProject(agent, accessToken, { title: 'Hackathon Build', category: 'hackathon' });

    const response = await request(app).get('/api/v1/projects?category=hackathon').expect(200);
    const titles = response.body.data.projects.map((p: { title: string }) => p.title);

    expect(titles).toEqual(['Hackathon Build']);
  });

  it('searches projects by title text', async () => {
    const { agent, accessToken } = await registerUser();
    await createProject(agent, accessToken, { title: 'Campus Carpool Finder' });
    await createProject(agent, accessToken, { title: 'Study Group Matcher' });

    const response = await request(app).get('/api/v1/projects?search=Carpool').expect(200);
    const titles = response.body.data.projects.map((p: { title: string }) => p.title);

    expect(titles).toEqual(['Campus Carpool Finder']);
  });

  it('paginates marketplace results', async () => {
    const { agent, accessToken } = await registerUser();
    for (let i = 0; i < 3; i += 1) {
      await createProject(agent, accessToken, { title: `Paginated Project ${i}` });
    }

    const response = await request(app).get('/api/v1/projects?limit=2&page=1').expect(200);
    expect(response.body.data.projects).toHaveLength(2);
    expect(response.body.meta.pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('toggles a bookmark on and off, and reflects it in isBookmarked', async () => {
    const owner = await registerUser();
    const bookmarker = await registerUser();
    const project = await createProject(owner.agent, owner.accessToken);

    const first = await bookmarker.agent
      .post(`/api/v1/projects/${project._id}/bookmark`)
      .set('Authorization', `Bearer ${bookmarker.accessToken}`)
      .expect(200);
    expect(first.body.data.bookmarked).toBe(true);

    const detail = await bookmarker.agent
      .get(`/api/v1/projects/${project._id}`)
      .set('Authorization', `Bearer ${bookmarker.accessToken}`)
      .expect(200);
    expect(detail.body.data.project.isBookmarked).toBe(true);

    const second = await bookmarker.agent
      .post(`/api/v1/projects/${project._id}/bookmark`)
      .set('Authorization', `Bearer ${bookmarker.accessToken}`)
      .expect(200);
    expect(second.body.data.bookmarked).toBe(false);
  });

  it("lists a user's bookmarks via GET /users/me/bookmarks", async () => {
    const owner = await registerUser();
    const bookmarker = await registerUser();
    const project = await createProject(owner.agent, owner.accessToken);

    await bookmarker.agent
      .post(`/api/v1/projects/${project._id}/bookmark`)
      .set('Authorization', `Bearer ${bookmarker.accessToken}`)
      .expect(200);

    const response = await bookmarker.agent
      .get('/api/v1/users/me/bookmarks')
      .set('Authorization', `Bearer ${bookmarker.accessToken}`)
      .expect(200);

    expect(response.body.data.bookmarks).toHaveLength(1);
    expect(response.body.data.bookmarks[0].title).toBe(baseProjectPayload.title);
    expect(response.body.data.bookmarks[0].isBookmarked).toBe(true);
    expect(response.body.data.bookmarks[0].teamSize).toBe(baseProjectPayload.teamSize);
  });
});
