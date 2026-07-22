'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { connectSocket, disconnectSocket } from './socketClient';

/**
 * Mirrors SessionProvider's lifecycle: once a session is confirmed (session
 * restore finished AND a user is present), opens the authenticated socket
 * connection; disconnects it on logout. Deliberately does not reconnect on
 * every access-token refresh — the socket stays authenticated as the
 * identified user for the life of the connection, the same way most
 * long-lived WebSocket sessions work; a fresh connection (e.g. after a full
 * page reload) always authenticates with the current token.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isInitializing) return;

    if (user && accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, user, accessToken]);

  return <>{children}</>;
}
