import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { projectRoom } from './io';
import { broadcastProjectPresence } from './presence';
import { teamService } from '@modules/teams/team.service';
import { messageService } from '@modules/chat/message.service';
import { sendMessageSchema } from '@modules/chat/message.validation';

interface WorkspacePayload {
  projectId: string;
}

interface MessageSendPayload {
  projectId: string;
  content: string;
}

/**
 * Tracks which project rooms this socket has joined, so a clean disconnect
 * can re-broadcast presence for each of them (Socket.IO removes the socket
 * from its rooms automatically on disconnect, but that doesn't by itself
 * notify the remaining room members that presence changed).
 */
function getJoinedProjects(socket: AuthenticatedSocket): Set<string> {
  if (!socket.data.joinedProjects) {
    socket.data.joinedProjects = new Set<string>();
  }
  return socket.data.joinedProjects as Set<string>;
}

export function registerChatHandlers(io: Server, rawSocket: unknown): void {
  const socket = rawSocket as AuthenticatedSocket;

  socket.on('workspace:join', async (payload: WorkspacePayload, ack?: (res: unknown) => void) => {
    try {
      const isMember = await teamService.isActiveMember(payload.projectId, socket.data.userId);
      if (!isMember) {
        ack?.({ success: false, error: 'You are not a member of this project' });
        return;
      }

      await socket.join(projectRoom(payload.projectId));
      getJoinedProjects(socket).add(payload.projectId);
      await broadcastProjectPresence(io, payload.projectId);
      ack?.({ success: true });
    } catch {
      ack?.({ success: false, error: 'Failed to join workspace' });
    }
  });

  socket.on('workspace:leave', async (payload: WorkspacePayload) => {
    await socket.leave(projectRoom(payload.projectId));
    getJoinedProjects(socket).delete(payload.projectId);
    await broadcastProjectPresence(io, payload.projectId);
  });

  socket.on('message:send', async (payload: MessageSendPayload, ack?: (res: unknown) => void) => {
    try {
      const isMember = await teamService.isActiveMember(payload.projectId, socket.data.userId);
      if (!isMember) {
        ack?.({ success: false, error: 'You are not a member of this project' });
        return;
      }

      const parsed = sendMessageSchema.safeParse({ content: payload.content });
      if (!parsed.success) {
        ack?.({ success: false, error: parsed.error.errors[0]?.message ?? 'Invalid message' });
        return;
      }

      // DB write happens first; the broadcast below only fires once it succeeds.
      const message = await messageService.create(payload.projectId, socket.data.userId, parsed.data);

      io.to(projectRoom(payload.projectId)).emit('message:new', message);
      ack?.({ success: true, data: message });
    } catch {
      ack?.({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    const joinedProjects = getJoinedProjects(socket);
    for (const projectId of joinedProjects) {
      // Socket.IO has already removed this socket from the room by the time
      // 'disconnect' fires, so this broadcast correctly excludes it.
      void broadcastProjectPresence(io, projectId);
    }
  });
}
