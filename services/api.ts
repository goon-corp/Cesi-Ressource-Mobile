import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Query params helper ──────────────────────────────────────────────────────

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return `${API_URL}${path}`;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      qs.append(key, String(value));
    }
  }
  const queryString = qs.toString();
  return queryString ? `${API_URL}${path}?${queryString}` : `${API_URL}${path}`;
}

// ─── Token management ─────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (API_KEY) {
        headers['x-api-key'] = API_KEY;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        throw new ApiError(response.status, 'Session expirée');
      }

      const data = await response.json();
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      }

      return data.accessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  authenticated = true,
  params?: QueryParams,
  retryCount = 0,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  if (authenticated) {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });



  if (response.status === 401 && authenticated && retryCount === 0) {
    try {
      const newToken = await refreshAccessToken();
      headers.Authorization = `Bearer ${newToken}`;
      
      const retryResponse = await fetch(buildUrl(path, params), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!retryResponse.ok) {
        const payload = await retryResponse.json().catch(() => ({}));
        throw new ApiError(
          retryResponse.status,
          (payload as { message?: string }).message ?? `Erreur ${retryResponse.status}`,
        );
      }

      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return retryResponse.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Session expirée');
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      (payload as { message?: string }).message ?? `Erreur ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Upload (multipart/form-data) ─────────────────────────────────────────────

async function upload<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  formData: FormData,
  authenticated = true,
  retryCount = 0,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  if (authenticated) {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  if (response.status === 401 && authenticated && retryCount === 0) {
    try {
      const newToken = await refreshAccessToken();
      headers.Authorization = `Bearer ${newToken}`;
      
      const retryResponse = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: formData,
      });

      if (!retryResponse.ok) {
        const payload = await retryResponse.json().catch(() => ({}));
        throw new ApiError(
          retryResponse.status,
          (payload as { message?: string }).message ?? `Erreur ${retryResponse.status}`,
        );
      }

      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return retryResponse.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Session expirée');
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      (payload as { message?: string }).message ?? `Erreur ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Public client ────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, authenticated = true, params?: QueryParams) =>
    request<T>('GET', path, undefined, authenticated, params),

  post: <T>(path: string, body: unknown, authenticated = true) =>
    request<T>('POST', path, body, authenticated),

  put: <T>(path: string, body: unknown, authenticated = true) =>
    request<T>('PUT', path, body, authenticated),

  patch: <T>(path: string, body: unknown, authenticated = true) =>
    request<T>('PATCH', path, body, authenticated),

  delete: <T>(path: string, authenticated = true) =>
    request<T>('DELETE', path, undefined, authenticated),

  upload: <T>(
    method: 'POST' | 'PUT' | 'PATCH',
    path: string,
    formData: FormData,
    authenticated = true,
  ) => upload<T>(method, path, formData, authenticated),
};