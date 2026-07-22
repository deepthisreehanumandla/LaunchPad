import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import http from 'http';
import { redisClient } from '@config/redis';
import { env } from '@config/env';
import { socketAuthMiddleware, AuthenticatedSocket } from './socketAuth';
import { setIO, userRoom } from './io';
import { registerChatHandlers } from './chat.socket';

/**
 * Boots the Socket.IO server on the same HTTP server as the REST API (see
 * server.ts). Must be called after Redis is connected, since the adapter
 * needs two dedicated (duplicated) Redis connections for its pub/sub
 * channel — reusing the app's existing Redis connection config, per the
 * "reuse the existing Redis setup" requirement, rather than opening a
 * separately-configured connection.
 */
export async function initializeSocketServer(httpServer: http.Server): Promise<Server> {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  // Both duplicates inherit `lazyConnect: true` from the shared redisClient
  // config (see config/redis.ts) — they need to be explicitly connected
  // before the adapter can use them for its pub/sub channel.
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuthMiddleware);

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;

    // Every socket auto-joins its owner's personal room, which is how
    // notification.service.ts (and anything else) targets "this user,
    // wherever they're connected" without knowing socket ids.
    void socket.join(userRoom(socket.data.userId));

    registerChatHandlers(io, socket);
  });

  setIO(io);
  return io;
}
