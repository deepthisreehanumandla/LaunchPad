import { useAuthStore } from '@/lib/auth/tokenStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message);
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  /** Internal flag to prevent infinite refresh loops. */
  _retried?: boolean;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, _retried, body, headers, ...rest } = options;
  const accessToken = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    credentials: 'include', // sends the httpOnly refresh cookie on auth endpoints
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // Access token expired mid-session — try one silent refresh, then retry the original call.
    if (response.status === 401 && !skipAuth && !_retried) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        return rawRequest<T>(path, { ...options, _retried: true });
      }
      useAuthStore.getState().clearSession();
    }

    throw new ApiRequestError(response.status, payload?.error ?? { code: 'UNKNOWN', message: 'Request failed' });
  }

  return (payload?.data ?? payload) as T;
}

async function tryRefreshAccessToken(): Promise<boolean> {
  try {
    const data = await rawRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
      _retried: true,
    });
    useAuthStore.getState().setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => rawRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    rawRequest<T>(path, { ...options, method: 'DELETE' }),
};

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Like apiClient.get, but also surfaces the `meta.pagination` envelope field
 * that list endpoints return — used by the marketplace and bookmarks views.
 */
export async function getWithPagination<T>(
  path: string,
  options?: RequestOptions,
): Promise<{ data: T; pagination?: Pagination }> {
  const accessToken = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: 'include',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !options?.skipAuth) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        return getWithPagination<T>(path, { ...options, _retried: true });
      }
      useAuthStore.getState().clearSession();
    }
    throw new ApiRequestError(response.status, payload?.error ?? { code: 'UNKNOWN', message: 'Request failed' });
  }

  return { data: payload?.data as T, pagination: payload?.meta?.pagination };
}

export { tryRefreshAccessToken };
