import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../../shared/errors/app-error.js';
import { hashToken } from '../domain/crypto.js';
import { AuthService } from './auth.service.js';

function config(isDev = true) {
  return { isDev, JWT_SECRET: 'test-secret-test-secret' } as never;
}

function events() {
  return { publish: vi.fn(async () => undefined), subscribe: vi.fn() };
}

function geo() {
  return { assertCity: vi.fn(async () => undefined) };
}

function email() {
  return { sendVerificationCode: vi.fn(async () => undefined) };
}

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'user1',
  displayName: 'User',
  avatarUrl: null,
  bio: null,
  country: 'RU',
  city: null,
  trustScore: 0,
  isVerified: false,
  role: 'user',
  emailVerifiedAt: null,
};

describe('AuthService verifyEmail', () => {
  it('marks email verified when code matches', async () => {
    const repo = {
      findUserById: vi.fn(async () => baseUser),
      findLatestActiveVerificationCode: vi.fn(async () => ({
        id: 'code-1',
        userId: 'user-1',
        codeHash: hashToken('123456'),
        attempts: 0,
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
        createdAt: new Date(),
      })),
      consumeVerificationCode: vi.fn(async () => undefined),
      markEmailVerified: vi.fn(async () => ({
        ...baseUser,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
      incrementVerificationAttempts: vi.fn(),
    };

    const service = new AuthService(
      repo as never,
      config(),
      events() as never,
      geo() as never,
      email() as never,
    );

    const result = await service.verifyEmail('user-1', { code: '123456' });
    expect(result.emailVerified).toBe(true);
    expect(repo.consumeVerificationCode).toHaveBeenCalledWith('code-1');
    expect(repo.markEmailVerified).toHaveBeenCalledWith('user-1');
  });

  it('rejects an invalid code and increments attempts', async () => {
    const repo = {
      findUserById: vi.fn(async () => baseUser),
      findLatestActiveVerificationCode: vi.fn(async () => ({
        id: 'code-1',
        userId: 'user-1',
        codeHash: hashToken('654321'),
        attempts: 0,
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
        createdAt: new Date(),
      })),
      consumeVerificationCode: vi.fn(),
      markEmailVerified: vi.fn(),
      incrementVerificationAttempts: vi.fn(async () => undefined),
    };

    const service = new AuthService(
      repo as never,
      config(),
      events() as never,
      geo() as never,
      email() as never,
    );

    await expect(service.verifyEmail('user-1', { code: '123456' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(repo.incrementVerificationAttempts).toHaveBeenCalledWith('code-1');
    expect(repo.markEmailVerified).not.toHaveBeenCalled();
  });
});

describe('AuthService register', () => {
  it('sends verification code after creating a user', async () => {
    const repo = {
      findUserByEmail: vi.fn(async () => null),
      findUserByUsername: vi.fn(async () => null),
      createUserWithEmail: vi.fn(async () => baseUser),
      invalidateVerificationCodes: vi.fn(async () => undefined),
      createVerificationCode: vi.fn(async () => ({ id: 'code-1' })),
      createSession: vi.fn(async () => ({ id: 'session-1' })),
    };
    const mail = email();

    const service = new AuthService(
      repo as never,
      config(true),
      events() as never,
      geo() as never,
      mail as never,
    );

    const result = await service.register(
      {
        email: 'user@example.com',
        password: 'password12',
        username: 'user1',
        country: 'RU',
      },
      {},
    );

    expect(mail.sendVerificationCode).toHaveBeenCalled();
    expect(result.user.emailVerified).toBe(false);
    expect(result.devVerificationCode).toMatch(/^\d{6}$/);
  });
});
