import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { projectRoom } from './io';

/**
 * Re-derives the online-user list for a project from the actual sockets
 * currently in its room (rather than maintaining a separate counter), so it
 * self-corrects on reconnects/multiple tabs/instance restarts without extra
 * bookkeeping. `fetchSockets()` is adapter-aware, so this is correct even
 * when sockets are spread across multiple Node instances behind the Redis
 * adapter.
 */
export async function broadcastProjectPresence(io: Server, projectId: string): Promise<void> {
  const sockets = await io.in(projectRoom(projectId)).fetchSockets();
  const onlineUserIds = Array.from(
    new Set(sockets.map((s) => (s as unknown as AuthenticatedSocket).data.userId)),
  );
  io.to(projectRoom(projectId)).emit('presence:update', { projectId, onlineUserIds });
}
