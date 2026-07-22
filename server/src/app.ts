import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, isProduction } from '@config/env';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import authRoutes from '@modules/auth/auth.routes';
import userRoutes from '@modules/users/user.routes';
import projectRoutes from '@modules/projects/project.routes';
import teamRoutes from '@modules/teams/team.routes';
import notificationRoutes from '@modules/notifications/notification.routes';
import messageRoutes from '@modules/chat/message.routes';
import taskRoutes from '@modules/tasks/task.routes';
import activityRoutes from '@modules/activity/activity.routes';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // needed for correct req.ip behind a reverse proxy / load balancer

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true, // required so the refresh-token cookie is sent/received
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/projects', teamRoutes); // handles /projects/:id/join-requests, /members, etc.
  app.use('/api/v1/projects', messageRoutes); // handles /projects/:id/messages (chat history)
  app.use('/api/v1/projects', taskRoutes); // handles /projects/:id/tasks (Kanban board)
  app.use('/api/v1/projects', activityRoutes); // handles /projects/:id/activity
  app.use('/api/v1/notifications', notificationRoutes);
  // Additional module routers (resources, analytics, showcase) are mounted
  // here as each phase lands.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
