import { useAuthStore, type AuthUser } from '@/shared/model/stores';
import { ACCESS_TOKEN_REFRESH_SKEW_MS, resolveApiUrl } from './config';

type AuthPayload = {
  accessToken: string;
  user: AuthUser;
  expiresIn?: number;
};

let refreshPromise: Promise<boolean> | null = null;

function waitForAuthHydration(): Promise<void> {
  const persistApi = useAuthStore.persist;
  if (persistApi.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    persistApi.onFinishHydration(() => resolve());
  });
}

function applyAuthPayload(data: AuthPayload) {
  useAuthStore.getState().setSession(data.accessToken, data.user, data.expiresIn);
}

async function doRefresh(): Promise<boolean> {
  try {
    const response = await fetch(resolveApiUrl('/v1/auth/refresh'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().clearSession();
      }
      return false;
    }

    const data = (await response.json()) as AuthPayload;
    applyAuthPayload(data);
    return true;
  } catch {
    return false;
  }
}

export async function refreshSession(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('markethub-refresh', () => doRefresh());
  }
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export function sessionNeedsRefresh(): boolean {
  const { accessToken, user, expiresAt } = useAuthStore.getState();
  if (!accessToken && !user) {
    return false;
  }
  if (!expiresAt) {
    return true;
  }
  return expiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS <= Date.now();
}

export async function ensureFreshSession(): Promise<boolean> {
  if (!sessionNeedsRefresh()) {
    return Boolean(useAuthStore.getState().accessToken);
  }
  return refreshSession();
}

export async function restoreSession(): Promise<void> {
  await waitForAuthHydration();
  if (!sessionNeedsRefresh()) {
    return;
  }
  const { accessToken, user } = useAuthStore.getState();
  if (!accessToken && !user) {
    return;
  }
  await refreshSession();
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(resolveApiUrl('/v1/auth/logout'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
  } finally {
    useAuthStore.getState().clearSession();
  }
}
