import { redirect } from '@tanstack/react-router';
import { restoreSession } from '@/shared/api/session';
import { useAuthStore } from '@/shared/model/stores';

function waitForAuthHydration(): Promise<void> {
  const persistApi = useAuthStore.persist;
  if (persistApi.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    persistApi.onFinishHydration(() => resolve());
  });
}

const AUTH_FLOW_PATHS = new Set(['/auth', '/forgot-password']);

const AUTH_REQUIRED_PATHS = new Set([
  '/messages',
  '/favorites',
  '/my-listings',
  '/purchases',
  '/sales',
  '/notifications',
  '/moderation',
]);

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/listings/create' || /\/edit$/.test(pathname)) return false;
  if (AUTH_REQUIRED_PATHS.has(pathname)) return false;
  return true;
}

export async function guardRoute(pathname: string) {
  await waitForAuthHydration();
  await restoreSession();

  const { user, accessToken } = useAuthStore.getState();
  const isAuthenticated = Boolean(user && accessToken);
  const isPublic = isPublicPath(pathname);
  const isAuthFlow = AUTH_FLOW_PATHS.has(pathname);
  const isVerifyEmailRoute = pathname === '/verify-email';

  if (isAuthFlow) {
    if (isAuthenticated) {
      throw redirect({ to: user!.emailVerified ? '/' : '/verify-email' });
    }
    return;
  }

  if (isVerifyEmailRoute) {
    if (!isAuthenticated) {
      throw redirect({ to: '/auth' });
    }
    if (user!.emailVerified) {
      throw redirect({ to: '/' });
    }
    return;
  }

  if (!isAuthenticated) {
    if (isPublic) return;
    throw redirect({ to: '/auth' });
  }

  if (!user!.emailVerified && !isPublic && !isVerifyEmailRoute) {
    throw redirect({ to: '/verify-email' });
  }

  if (user!.emailVerified && isVerifyEmailRoute) {
    throw redirect({ to: '/' });
  }
}
