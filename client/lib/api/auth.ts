import { apiClient } from './client';
import type { AuthenticatedUser } from '@/types/user';

interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
}

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', input, { skipAuth: true }),

  login: (input: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', input, { skipAuth: true }),

  logout: () => apiClient.post<{ loggedOut: boolean }>('/auth/logout'),
};
