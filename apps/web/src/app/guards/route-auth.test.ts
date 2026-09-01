import { describe, expect, it, vi, beforeEach } from 'vitest';

const restoreSession = vi.fn(async () => undefined);

vi.mock('@/shared/api/session', () => ({
  restoreSession,
}));

const authState = {
  user: null as null | { emailVerified: boolean },
  accessToken: null as string | null,
};

vi.mock('@/shared/model/stores', () => ({
  useAuthStore: {
    getState: () => authState,
    persist: {
      hasHydrated: () => true,
      onFinishHydration: (cb: () => void) => cb(),
    },
  },
}));

describe('guardRoute', () => {
  beforeEach(() => {
    authState.user = null;
    authState.accessToken = null;
    restoreSession.mockClear();
  });

  it('redirects anonymous users to auth', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/catalog')).rejects.toMatchObject({
      options: { to: '/auth' },
    });
  });

  it('allows anonymous users on auth page', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/auth')).resolves.toBeUndefined();
  });

  it('redirects signed-in users away from auth', async () => {
    authState.user = { emailVerified: true };
    authState.accessToken = 'token';
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/auth')).rejects.toMatchObject({
      options: { to: '/' },
    });
  });

  it('redirects unverified users to verify-email', async () => {
    authState.user = { emailVerified: false };
    authState.accessToken = 'token';
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/catalog')).rejects.toMatchObject({
      options: { to: '/verify-email' },
    });
  });
});
