import { io, Socket } from 'socket.io-client';
import { useSocketStore } from './socketStore';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1$/, '') ?? 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Creates (or returns the existing) authenticated socket connection.
 * The access token is passed via the handshake `auth` payload, mirroring
 * how the REST client attaches it as a Bearer header — see
 * server/src/sockets/socketAuth.ts, which verifies it with the exact same
 * JWT logic as the REST `authenticate` middleware.
 */
export function connectSocket(accessToken: string): Socket {
  if (socket?.connected && socket.auth && (socket.auth as { token: string }).token === accessToken) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
  });

  useSocketStore.getState().setSocket(socket);
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  useSocketStore.getState().setSocket(null);
}
