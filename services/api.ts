import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

// ─── In-memory token cache ─────────────────────────────────────────────────────
// Avoids a SecureStore hardware read (50–200ms) on every authenticated request.

let memoryToken: string | null = null;

async function getAccessToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
  memoryToken = stored;
  return stored;
}

export function setAccessToken(token: string) {
  memoryToken = token;
  SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token).catch(() => null);
}

export function clearAccessToken() {
  memoryToken = null;
}

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

export type QueryParams = Record<string, string | number | boolean | null | undefined | string[]>;

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return `${API_URL}${path}`;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.append(key, String(value));
    }
  }
  const queryString = qs.toString();
  return queryString ? `${API_URL}${path}?${queryString}` : `${API_URL}${path}`;
}

// ─── Result pattern ───────────────────────────────────────────────────────────

interface ResultResponse<T = unknown> {
  is_success: boolean;
  error: string | null;
  errors: string[];
  data?: T;
}

/**
 * Extracts `data` from a Result<T> response.
 * Throws ApiError if is_success is false, using errors/error fields.
 */
function extractApiResult<T>(json: unknown): T {
  const result = json as ResultResponse<T>;
  if (!result.is_success) {
    const message =
      result.errors?.length
        ? result.errors.join(', ')
        : result.error ?? 'Une erreur est survenue';
    throw new ApiError(422, message);
  }
  return result.data as T;
}

/**
 * Extracts the best error message from a non-2xx response body.
 * With extractResult=true, prefers Result pattern fields over generic `message`.
 */
function extractErrorMessage(payload: unknown, extractResult: boolean, status: number): string {
  if (extractResult) {
    const result = payload as Partial<ResultResponse>;
    if (result?.errors?.length) return result.errors.join(', ');
    if (result?.error) return result.error;
  }
  const p = payload as { message?: string; error?: string };
  return p?.message ?? p?.error ?? `Erreur ${status}`;
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
        clearAccessToken();
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
        throw new ApiError(response.status, 'Session expirée');
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      if (data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken).catch(() => null);
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
  extractResult = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  if (authenticated) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
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
          extractErrorMessage(payload, extractResult, retryResponse.status),
        );
      }

      if (retryResponse.status === 204) return undefined as T;

      const retryText = await retryResponse.text();
      if (!retryText) return undefined as T;
      const retryJson = JSON.parse(retryText);
      return extractResult ? extractApiResult<T>(retryJson) : (retryJson as T);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Session expirée');
    }
  }


  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      extractErrorMessage(payload, extractResult, response.status),
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  const json = JSON.parse(text);
  return extractResult ? extractApiResult<T>(json) : (json as T);
}

// ─── Upload (multipart/form-data) ─────────────────────────────────────────────

async function upload<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  formData: FormData,
  authenticated = true,
  extractResult = false,
  retryCount = 0,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  if (authenticated) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
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
          extractErrorMessage(payload, extractResult, retryResponse.status),
        );
      }

      if (retryResponse.status === 204) return undefined as T;

      const retryText = await retryResponse.text();
      if (!retryText) return undefined as T;
      const retryJson = JSON.parse(retryText);
      return extractResult ? extractApiResult<T>(retryJson) : (retryJson as T);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Session expirée');
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      extractErrorMessage(payload, extractResult, response.status),
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  const json = JSON.parse(text);
  return extractResult ? extractApiResult<T>(json) : (json as T);
}

// ─── Public client ────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, authenticated = true, params?: QueryParams, extractResult = false) =>
    request<T>('GET', path, undefined, authenticated, params, 0, extractResult),

  post: <T>(path: string, body: unknown, authenticated = true, extractResult = false) =>
    request<T>('POST', path, body, authenticated, undefined, 0, extractResult),

  put: <T>(path: string, body: unknown, authenticated = true, extractResult = false) =>
    request<T>('PUT', path, body, authenticated, undefined, 0, extractResult),

  patch: <T>(path: string, body: unknown, authenticated = true, extractResult = false) =>
    request<T>('PATCH', path, body, authenticated, undefined, 0, extractResult),

  delete: <T>(path: string, authenticated = true, extractResult = false) =>
    request<T>('DELETE', path, undefined, authenticated, undefined, 0, extractResult),

  upload: <T>(
    method: 'POST' | 'PUT' | 'PATCH',
    path: string,
    formData: FormData,
    authenticated = true,
    extractResult = false,
  ) => upload<T>(method, path, formData, authenticated, extractResult),
};
