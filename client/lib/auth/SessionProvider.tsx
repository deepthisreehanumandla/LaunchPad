'use client';

import { useEffect } from 'react';
import { tryRefreshAccessToken } from '@/lib/api/client';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/lib/auth/tokenStore';

/**
 * On first mount, silently attempts to exchange the httpOnly refresh cookie
 * for a new access token, then fetches the current user so `useAuthStore().user`
 * is populated again — otherwise a page reload would leave a still-logged-in
 * user with an access token but no `user`, and useRequireAuth would incorrectly
 * bounce them to /login. If refresh fails, the user is simply treated as
 * logged out — no error is surfaced, since "not logged in" is a valid state.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const refreshed = await tryRefreshAccessToken();
      if (cancelled) return;

      if (!refreshed) {
        clearSession();
        return;
      }

      try {
        const me = await usersApi.getMe();
        if (cancelled) return;
        setSession(useAuthStore.getState().accessToken ?? '', {
          _id: me._id,
          name: me.name,
          email: me.email ?? '',
        });
      } catch {
        if (!cancelled) clearSession();
      }
    }

    restoreSession().finally(() => {
      if (!cancelled) setInitializing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [setInitializing, setSession, clearSession]);

  return <>{children}</>;
}
