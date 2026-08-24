import { useAuthStore } from '@/shared/model/stores';
import { API_URL, chatSocketUrl, resolveApiUrl } from './config';
import { ensureFreshSession, refreshSession } from './session';

export { API_URL, chatSocketUrl };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  skipAuth?: boolean;
};

type ErrorBody = {
  error?: { code?: string; message?: string };
  code?: string;
  message?: string;
};

async function readError(response: Response): Promise<ApiError> {
  let message = response.statusText;
  let code: string | undefined;
  try {
    const data = (await response.json()) as ErrorBody;
    message = data.error?.message ?? data.message ?? message;
    code = data.error?.code ?? data.code;
  } catch {
    // ignore non-JSON error bodies
  }
  return new ApiError(response.status, message, code);
}

function resolveToken(options: RequestOptions): string | null {
  if (options.skipAuth) {
    return null;
  }
  return useAuthStore.getState().accessToken ?? options.token ?? null;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  return fetch(resolveApiUrl(path), {
    ...init,
    credentials: 'include',
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!options.skipAuth) {
    await ensureFreshSession();
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = resolveToken(options);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  };

  let response = await send(path, init);

  if (response.status === 401 && !options.skipAuth && path !== '/v1/auth/refresh') {
    const refreshed = await refreshSession();
    if (refreshed) {
      const nextToken = useAuthStore.getState().accessToken;
      if (nextToken) {
        headers.Authorization = `Bearer ${nextToken}`;
      } else {
        delete headers.Authorization;
      }
      response = await send(path, { ...init, headers });
    }
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return parseJson<T>(response);
}

export async function apiUpload<T>(path: string, file: File, token?: string | null): Promise<T> {
  await ensureFreshSession();

  const form = () => {
    const data = new FormData();
    data.append('file', file);
    return data;
  };

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const accessToken = useAuthStore.getState().accessToken ?? token ?? null;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await send(path, {
    method: 'POST',
    headers,
    body: form(),
  });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const nextToken = useAuthStore.getState().accessToken;
      if (nextToken) {
        headers.Authorization = `Bearer ${nextToken}`;
      }
      response = await send(path, {
        method: 'POST',
        headers,
        body: form(),
      });
    }
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as T;
}
