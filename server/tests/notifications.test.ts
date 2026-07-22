import request from 'supertest';
import { app, registerUser } from './helpers';

const baseProjectPayload = {
  title: 'LaunchPad Mobile App',
  shortDescription: 'A mobile client for the LaunchPad platform',
  detailedDescription: 'We are building a React Native client so students can collaborate on the go.',
  category: 'startup' as const,
  purpose: 'team-formation' as const,
  techStack: ['React Native'],
  requiredSkills: ['Design'],
  teamSize: 5,
};

async function createProject(agent: ReturnType<typeof request.agent>, accessToken: string) {
  const response = await agent
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(baseProjectPayload)
    .expect(201);
  return response.body.data.project;
}

async function generateOneNotification() {
  const owner = await registerUser();
  const requester = await registerUser();
  const project = await createProject(owner.agent, owner.accessToken);

  await requester.agent
    .post(`/api/v1/projects/${project._id}/join-requests`)
    .set('Authorization', `Bearer ${requester.accessToken}`)
    .send({})
    .expect(201);

  return { owner, requester, project };
}

describe('Notifications', () => {
  it('requires authentication for every notification route', async () => {
    await request(app).get('/api/v1/notifications').expect(401);
    await request(app).get('/api/v1/notifications/unread-count').expect(401);
    await request(app).patch('/api/v1/notifications/read-all').expect(401);
    await request(app).patch('/api/v1/notifications/64b64b64b64b64b64b64b64b/read').expect(401);
  });

  it('lists notifications for the recipient, newest first', async () => {
    const { owner } = await generateOneNotification();

    const response = await owner.agent
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body.data.notifications).toHaveLength(1);
    expect(response.body.data.notifications[0].type).toBe('join-request');
    expect(response.body.data.notifications[0].read).toBe(false);
    expect(response.body.meta.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('reports the correct unread count', async () => {
    const { owner } = await generateOneNotification();

    const response = await owner.agent
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(response.body.data.count).toBe(1);
  });

  it('marks a single notification as read, reducing the unread count', async () => {
    const { owner } = await generateOneNotification();

    const list = await owner.agent
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const notificationId = list.body.data.notifications[0]._id;

    await owner.agent
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const count = await owner.agent
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(count.body.data.count).toBe(0);
  });

  it('does not let a user mark someone else\u2019s notification as read', async () => {
    const { owner } = await generateOneNotification();
    const outsider = await registerUser();

    const list = await owner.agent
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const notificationId = list.body.data.notifications[0]._id;

    const response = await outsider.agent
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('marks all notifications as read', async () => {
    const owner = await registerUser();
    const requesterA = await registerUser();
    const requesterB = await registerUser();
    const project = await createProject(owner.agent, owner.accessToken);

    await requesterA.agent
      .post(`/api/v1/projects/${project._id}/join-requests`)
      .set('Authorization', `Bearer ${requesterA.accessToken}`)
      .send({})
      .expect(201);
    await requesterB.agent
      .post(`/api/v1/projects/${project._id}/join-requests`)
      .set('Authorization', `Bearer ${requesterB.accessToken}`)
      .send({})
      .expect(201);

    const beforeCount = await owner.agent
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(beforeCount.body.data.count).toBe(2);

    await owner.agent
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    const afterCount = await owner.agent
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(afterCount.body.data.count).toBe(0);
  });

  it('returns 404 for a non-existent notification id', async () => {
    const owner = await registerUser();
    const response = await owner.agent
      .patch('/api/v1/notifications/64b64b64b64b64b64b64b64b/read')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
