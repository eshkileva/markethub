import { expect, type APIRequestContext, type Page } from '@playwright/test';

type AuthSession = {
  accessToken: string;
  expiresIn?: number;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio?: string | null;
    country: string;
    city: string | null;
    trustScore: number;
    isVerified: boolean;
    role: string;
    emailVerified: boolean;
  };
};

type RegisterInput = {
  email: string;
  password: string;
  username: string;
  country: 'BY' | 'RU' | 'KZ';
  displayName?: string;
};

type RegisterResponse = AuthSession & {
  devVerificationCode?: string;
};

export async function seedBrowserSession(page: Page, session: AuthSession) {
  await page.addInitScript(
    ({ token, profile, ttl }) => {
      localStorage.setItem(
        'markethub-auth',
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
    { token: session.accessToken, profile: session.user, ttl: session.expiresIn ?? 900 },
  );
}

export async function loginDemoInBrowser(page: Page, apiBase: string) {
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

type RegisterInput = {
  email: string;
  password: string;
  username: string;
  country: 'BY' | 'RU' | 'KZ';
  displayName?: string;
};

type RegisterResponse = {
  accessToken: string;
  expiresIn?: number;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    country: string;
    city: string | null;
    trustScore: number;
    isVerified: boolean;
    role: string;
    emailVerified: boolean;
  };
  devVerificationCode?: string;
};

export async function registerVerifiedUser(
  request: APIRequestContext,
  apiBase: string,
  input: RegisterInput,
) {
  const registerRes = await request.post(`${apiBase}/v1/auth/register`, {
    headers: { 'content-type': 'application/json' },
    data: input,
  });
  if (!registerRes.ok()) {
    throw new Error(`register failed: ${registerRes.status()} ${await registerRes.text()}`);
  }

  const registerJson = (await registerRes.json()) as RegisterResponse;
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

  const verifiedUser = (await verifyRes.json()) as RegisterResponse['user'];
  return {
    ...registerJson,
    user: verifiedUser,
  };
}
