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
  teamSize: 2,
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

describe('Team Formation', () => {
  describe('Sending join requests', () => {
    it('sends a join request and notifies the project owner', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const response = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({ message: 'I would love to help build this!' })
        .expect(201);

      expect(response.body.data.joinRequest.status).toBe('pending');

      const ownerNotifications = await owner.agent
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      expect(ownerNotifications.body.data.notifications).toHaveLength(1);
      expect(ownerNotifications.body.data.notifications[0].type).toBe('join-request');
    });

    it('rejects a join request to your own project', async () => {
      const owner = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const response = await owner.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({})
        .expect(400);
      expect(response.body.error.code).toBe('OWN_PROJECT');
    });

    it('rejects a join request to a personal-showcase project', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken, {
        purpose: 'personal-showcase',
        requiredSkills: [],
      });

      const response = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(400);
      expect(response.body.error.code).toBe('PROJECT_NOT_RECRUITING');
    });

    it('rejects a duplicate pending join request', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      const response = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(409);
      expect(response.body.error.code).toBe('REQUEST_ALREADY_PENDING');
    });

    it('rejects a join request from an existing member', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const sendRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${sendRes.body.data.joinRequest._id}/accept`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      const response = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(409);
      expect(response.body.error.code).toBe('ALREADY_MEMBER');
    });

    it('rejects a join request once the team is full', async () => {
      const owner = await registerUser();
      const requesterA = await registerUser();
      const requesterB = await registerUser();
      // teamSize 2 => creator + 1 more fills it
      const project = await createProject(owner.agent, owner.accessToken, { teamSize: 2 });

      const reqA = await requesterA.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requesterA.accessToken}`)
        .send({})
        .expect(201);
      await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${reqA.body.data.joinRequest._id}/accept`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      const response = await requesterB.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requesterB.accessToken}`)
        .send({})
        .expect(409);
      expect(response.body.error.code).toBe('TEAM_FULL');
    });

    it('requires authentication to send a join request', async () => {
      const owner = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);
      await request(app).post(`/api/v1/projects/${project._id}/join-requests`).send({}).expect(401);
    });
  });

  describe('Owner accept/reject flow and permissions', () => {
    it('only the owner can list pending join requests', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const outsider = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      const forbidden = await outsider.agent
        .get(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
      expect(forbidden.body.error.code).toBe('FORBIDDEN');

      const allowed = await owner.agent
        .get(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      expect(allowed.body.data.joinRequests).toHaveLength(1);
    });

    it('accepts a join request, adds the member, and notifies the requester', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const sendRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      const acceptRes = await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${sendRes.body.data.joinRequest._id}/accept`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      expect(acceptRes.body.data.joinRequest.status).toBe('accepted');

      const projectRes = await request(app).get(`/api/v1/projects/${project._id}`).expect(200);
      expect(projectRes.body.data.project.members).toHaveLength(2);

      const requesterProjects = await request(app)
        .get(`/api/v1/users/${requester.user._id}/projects`)
        .expect(200);
      expect(requesterProjects.body.data.contributed).toHaveLength(1);

      const requesterNotifications = await requester.agent
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .expect(200);
      const types = requesterNotifications.body.data.notifications.map((n: { type: string }) => n.type);
      expect(types).toContain('request-accepted');
    });

    it('only the owner can accept a join request', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const outsider = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const sendRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      const response = await outsider.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${sendRes.body.data.joinRequest._id}/accept`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects a join request and notifies the requester', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const sendRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      const rejectRes = await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${sendRes.body.data.joinRequest._id}/reject`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
      expect(rejectRes.body.data.joinRequest.status).toBe('rejected');

      const requesterNotifications = await requester.agent
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .expect(200);
      const types = requesterNotifications.body.data.notifications.map((n: { type: string }) => n.type);
      expect(types).toContain('request-rejected');

      // Rejected requesters are free to request again.
      await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);
    });

    it('rejects accepting/rejecting a request that was already responded to', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const sendRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);
      const joinRequestId = sendRes.body.data.joinRequest._id;

      await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${joinRequestId}/accept`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      const response = await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${joinRequestId}/reject`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(409);
      expect(response.body.error.code).toBe('ALREADY_RESPONDED');
    });
  });

  describe('Members', () => {
    it('lists members publicly, without authentication', async () => {
      const owner = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const response = await request(app).get(`/api/v1/projects/${project._id}/members`).expect(200);
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].role).toBe('creator');
    });

    it('only the owner can remove a member, and the creator cannot be removed', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const outsider = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      const sendRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);
      await owner.agent
        .patch(`/api/v1/projects/${project._id}/join-requests/${sendRes.body.data.joinRequest._id}/accept`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      // Creator cannot be removed, even by themselves.
      const creatorRemoval = await owner.agent
        .delete(`/api/v1/projects/${project._id}/members/${owner.user._id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(400);
      expect(creatorRemoval.body.error.code).toBe('CANNOT_REMOVE_CREATOR');

      // Non-owner cannot remove anyone.
      await outsider.agent
        .delete(`/api/v1/projects/${project._id}/members/${requester.user._id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);

      // Owner can remove the member.
      await owner.agent
        .delete(`/api/v1/projects/${project._id}/members/${requester.user._id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      const membersRes = await request(app).get(`/api/v1/projects/${project._id}/members`).expect(200);
      expect(membersRes.body.data.members).toHaveLength(1);

      // The removed member can request to join again (a new pending request).
      const rejoinRes = await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);
      expect(rejoinRes.body.data.joinRequest.status).toBe('pending');
    });
  });

  describe("My join requests", () => {
    it('lists a user\u2019s sent join requests', async () => {
      const owner = await registerUser();
      const requester = await registerUser();
      const project = await createProject(owner.agent, owner.accessToken);

      await requester.agent
        .post(`/api/v1/projects/${project._id}/join-requests`)
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .send({})
        .expect(201);

      const response = await requester.agent
        .get('/api/v1/users/me/join-requests')
        .set('Authorization', `Bearer ${requester.accessToken}`)
        .expect(200);

      expect(response.body.data.sent).toHaveLength(1);
      expect(response.body.data.sent[0].status).toBe('pending');
    });
  });
});
