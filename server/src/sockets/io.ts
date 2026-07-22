import { Server } from 'socket.io';

let io: Server | null = null;

/** Called once from sockets/index.ts after the Socket.IO server is created. */
export function setIO(instance: Server): void {
  io = instance;
}

/** For code paths (tests, scripts) that run without a live socket server. */
export function getIO(): Server | null {
  return io;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function projectRoom(projectId: string): string {
  return `project:${projectId}`;
}

/**
 * Emits an event to every socket a given user has open (across tabs/devices,
 * and across server instances via the Redis adapter). Safe to call even if
 * the socket server hasn't been initialized (e.g. in a script or test run
 * that never calls initializeSocketServer) — it just becomes a no-op.
 */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}

/** Emits to every socket currently viewing a given project's workspace. */
export function emitToProject(projectId: string, event: string, payload: unknown): void {
  io?.to(projectRoom(projectId)).emit(event, payload);
}

export { userRoom, projectRoom };
