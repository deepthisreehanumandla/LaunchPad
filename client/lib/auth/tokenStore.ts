import { create } from 'zustand';
import type { AuthenticatedUser } from '@/types/user';

interface AuthState {
  accessToken: string | null;
  user: AuthenticatedUser | null;
  isInitializing: boolean; // true while the silent-refresh-on-load check is in flight
  setSession: (accessToken: string, user: AuthenticatedUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setInitializing: (value: boolean) => void;
}

/**
 * Access tokens live in memory only — never in localStorage/sessionStorage —
 * to limit exposure if an XSS vulnerability is ever introduced elsewhere in
 * the app. The refresh token never touches JS at all; it's an httpOnly cookie
 * (see server/src/modules/auth/auth.controller.ts).
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null, user: null }),
  setInitializing: (value) => set({ isInitializing: value }),
}));
