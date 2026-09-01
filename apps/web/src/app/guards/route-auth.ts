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

export async function guardRoute(pathname: string) {
  await waitForAuthHydration();
  await restoreSession();

  const { user, accessToken } = useAuthStore.getState();
  const isAuthenticated = Boolean(user && accessToken);
  const isAuthRoute = pathname === '/auth';
  const isVerifyEmailRoute = pathname === '/verify-email';

  if (isAuthRoute) {
    if (isAuthenticated) {
      throw redirect({ to: user!.emailVerified ? '/' : '/verify-email' });
    }
    return;
  }

  if (!isAuthenticated) {
    throw redirect({ to: '/auth' });
  }

  if (!user!.emailVerified && !isVerifyEmailRoute) {
    throw redirect({ to: '/verify-email' });
  }

  if (user!.emailVerified && isVerifyEmailRoute) {
    throw redirect({ to: '/' });
  }
}
