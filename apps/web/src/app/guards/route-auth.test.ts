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

  it('allows anonymous users on public catalog', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/catalog')).resolves.toBeUndefined();
  });

  it('allows anonymous users on listing detail', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/listings/abc-123')).resolves.toBeUndefined();
  });

  it('redirects anonymous users from protected routes to auth', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/messages')).rejects.toMatchObject({
      options: { to: '/auth' },
    });
  });

  it('allows anonymous users on auth page', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/auth')).resolves.toBeUndefined();
  });

  it('allows anonymous users on forgot-password page', async () => {
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/forgot-password')).resolves.toBeUndefined();
  });

  it('redirects signed-in users away from auth', async () => {
    authState.user = { emailVerified: true };
    authState.accessToken = 'token';
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/auth')).rejects.toMatchObject({
      options: { to: '/' },
    });
  });

  it('redirects unverified users from protected routes to verify-email', async () => {
    authState.user = { emailVerified: false };
    authState.accessToken = 'token';
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/messages')).rejects.toMatchObject({
      options: { to: '/verify-email' },
    });
  });

  it('allows unverified users on public catalog', async () => {
    authState.user = { emailVerified: false };
    authState.accessToken = 'token';
    const { guardRoute } = await import('./route-auth');
    await expect(guardRoute('/catalog')).resolves.toBeUndefined();
  });
});

describe('isPublicPath', () => {
  it('marks marketplace browse routes as public', async () => {
    const { isPublicPath } = await import('./route-auth');
    expect(isPublicPath('/')).toBe(true);
    expect(isPublicPath('/catalog')).toBe(true);
    expect(isPublicPath('/listings/123')).toBe(true);
    expect(isPublicPath('/profile/seller')).toBe(true);
    expect(isPublicPath('/settings')).toBe(true);
    expect(isPublicPath('/messages')).toBe(false);
    expect(isPublicPath('/listings/create')).toBe(false);
  });
});
