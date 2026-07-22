import { Socket } from 'socket.io';
import { verifyAccessToken } from '@shared/utils/jwt';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    /** Populated lazily by chat.socket.ts to support clean-disconnect presence updates. */
    joinedProjects?: Set<string>;
  };
}

/**
 * Mirrors middleware/authenticate.ts, but for the Socket.IO handshake instead
 * of an HTTP request. The client sends its access token via
 * `io(url, { auth: { token } })` (see client/lib/socket/socketClient.ts) —
 * the same in-memory access token already used for REST calls.
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    (socket as AuthenticatedSocket).data.userId = payload.sub;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
