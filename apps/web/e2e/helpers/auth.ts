import { expect, type APIRequestContext, type Page } from '@playwright/test';
import type { AuthResponse, AuthUser, RegisterInput } from '@markethub/shared';
import { AUTH_STORAGE_KEY } from '../../src/shared/constants/auth';
import { E2E_API_BASE } from './config';

type AuthSession = AuthResponse;

export async function seedBrowserSession(page: Page, session: AuthSession) {
  await page.addInitScript(
    ({ token, profile, ttl, storageKey }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: {
            accessToken: token,
            user: profile,
            expiresAt: Date.now() + ttl * 1000,
          },
          version: 0,
        }),
      );
    },
    {
      token: session.accessToken,
      profile: session.user,
      ttl: session.expiresIn ?? 900,
      storageKey: AUTH_STORAGE_KEY,
    },
  );
}

export async function loginDemoInBrowser(page: Page, apiBase = E2E_API_BASE) {
  const loginRes = await page.request.post(`${apiBase}/v1/auth/login`, {
    headers: { 'content-type': 'application/json' },
    data: { email: 'demo@markethub.local', password: 'password12' },
  });
  if (!loginRes.ok()) {
    throw new Error(`demo login failed: ${loginRes.status()} ${await loginRes.text()}`);
  }
  const session = (await loginRes.json()) as AuthSession;
  await seedBrowserSession(page, session);
  return session;
}

export async function expectAuthRedirect(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('heading', { name: 'Вход в Купилко' })).toBeVisible();
}

export async function registerVerifiedUser(
  request: APIRequestContext,
  input: RegisterInput,
  apiBase = E2E_API_BASE,
) {
  const registerRes = await request.post(`${apiBase}/v1/auth/register`, {
    headers: { 'content-type': 'application/json' },
    data: input,
  });
  if (!registerRes.ok()) {
    throw new Error(`register failed: ${registerRes.status()} ${await registerRes.text()}`);
  }

  const registerJson = (await registerRes.json()) as AuthResponse;
  if (registerJson.user.emailVerified) {
    return registerJson;
  }

  const code = registerJson.devVerificationCode;
  if (!code) {
    throw new Error('devVerificationCode missing from register response');
  }

  const verifyRes = await request.post(`${apiBase}/v1/auth/verify-email`, {
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${registerJson.accessToken}`,
    },
    data: { code },
  });
  if (!verifyRes.ok()) {
    throw new Error(`verify-email failed: ${verifyRes.status()} ${await verifyRes.text()}`);
  }

  const verifiedUser = (await verifyRes.json()) as AuthUser;
  return {
    ...registerJson,
    user: verifiedUser,
  };
}

export async function loginApiUser(
  request: APIRequestContext,
  email: string,
  password: string,
  apiBase = E2E_API_BASE,
) {
  const loginRes = await request.post(`${apiBase}/v1/auth/login`, {
    headers: { 'content-type': 'application/json' },
    data: { email, password },
  });
  if (!loginRes.ok()) {
    throw new Error(`login failed: ${loginRes.status()} ${await loginRes.text()}`);
  }
  return (await loginRes.json()) as AuthResponse;
}

/** Without AI in CI, publish routes to pending_moderation — approve so feed e2e can see the listing. */
export async function ensureListingPublished(
  request: APIRequestContext,
  listingId: string,
  publishStatus: string,
  apiBase = E2E_API_BASE,
) {
  if (publishStatus === 'published') return;

  const moderator = await loginApiUser(request, 'moderator@markethub.local', 'password12', apiBase);
  const approveRes = await request.post(`${apiBase}/v1/moderation/listings/${listingId}/approve`, {
    headers: { Authorization: `Bearer ${moderator.accessToken}` },
  });
  if (!approveRes.ok()) {
    throw new Error(`moderator approve failed: ${approveRes.status()} ${await approveRes.text()}`);
  }
}
