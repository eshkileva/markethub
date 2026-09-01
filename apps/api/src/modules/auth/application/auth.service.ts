import type {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '@markethub/shared';
import type { z } from 'zod';
import type { AppConfig } from '../../../config/env.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import type { EmailSender } from '../../../infrastructure/email/email-sender.js';
import {
  ConflictError,
  EmailNotVerifiedError,
  UnauthorizedError,
  ValidationError,
} from '../../../shared/errors/app-error.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  generateRefreshToken,
  generateVerificationCode,
  hashPassword,
  hashToken,
  signAccessToken,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_MS,
  verifyPassword,
} from '../domain/crypto.js';
import type { AuthRepository } from '../infrastructure/auth.repository.js';
import type { CountryCode } from '@markethub/shared';
import type { GeoService } from '../../geo/application/geo.service.js';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

function publicUser(user: {
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
  emailVerifiedAt: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    country: user.country,
    city: user.city,
    trustScore: user.trustScore,
    isVerified: user.isVerified,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

type SessionUser = Parameters<typeof publicUser>[0];

export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly config: AppConfig,
    private readonly events: EventBus,
    private readonly geo: GeoService,
    private readonly email: EmailSender,
  ) {}

  async register(input: RegisterInput, meta: { userAgent?: string; ip?: string }) {
    const existingEmail = await this.repo.findUserByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }
    const existingUsername = await this.repo.findUserByUsername(input.username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.repo.createUserWithEmail({
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      country: input.country,
      passwordHash,
    });

    await this.events.publish('UserRegistered', { userId: user.id, email: user.email });

    const verificationCode = await this.issueVerificationCode(user.id, user.email);
    const session = await this.issueSession(user, meta);

    return {
      ...session,
      devVerificationCode: this.config.isDev ? verificationCode : undefined,
    };
  }

  async login(input: LoginInput, meta: { userAgent?: string; ip?: string }) {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const identity = await this.repo.findEmailIdentity(user.id);
    if (!identity?.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const ok = await verifyPassword(identity.passwordHash, input.password);
    if (!ok) {
      throw new UnauthorizedError('Invalid email or password');
    }
    return this.issueSession(user, meta);
  }

  async refresh(refreshToken: string, meta: { userAgent?: string; ip?: string }) {
    const session = await this.repo.findActiveSessionByHash(hashToken(refreshToken));
    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Session expired');
    }
    const user = await this.repo.findUserById(session.userId);
    if (!user) {
      throw new UnauthorizedError('Session expired');
    }
    await this.repo.revokeSession(session.id);
    return this.issueSession(user, meta);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    const session = await this.repo.findActiveSessionByHash(hashToken(refreshToken));
    if (session) {
      await this.repo.revokeSession(session.id);
    }
  }

  async logoutAll(userId: string) {
    await this.repo.revokeAllUserSessions(userId);
  }

  async me(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    const identities = await this.repo.listIdentities(userId);
    return {
      user: publicUser(user),
      identities: identities.map((i) => ({
        id: i.id,
        provider: i.provider,
        providerAccountId: i.providerAccountId,
        createdAt: i.createdAt.toISOString(),
      })),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.username) {
      const taken = await this.repo.findUserByUsername(input.username);
      if (taken && taken.id !== userId) {
        throw new ConflictError('Username already taken');
      }
    }
    if (input.city) {
      const existing = await this.repo.findUserById(userId);
      const country = (input.country ?? existing?.country) as CountryCode | undefined;
      if (country) await this.geo.assertCity(country, input.city);
    }
    const user = await this.repo.updateUser(userId, {
      ...input,
      username: input.username ? input.username.toLowerCase() : undefined,
    });
    if (!user) {
      throw new UnauthorizedError();
    }
    return publicUser(user);
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const identity = await this.repo.findEmailIdentity(userId);
    if (!identity?.passwordHash) {
      throw new ValidationError('Password login is not available for this account');
    }
    const ok = await verifyPassword(identity.passwordHash, input.currentPassword);
    if (!ok) {
      throw new UnauthorizedError('Invalid current password');
    }
    if (input.currentPassword === input.newPassword) {
      throw new ValidationError('New password must be different');
    }
    await this.repo.updatePasswordHash(identity.id, await hashPassword(input.newPassword));
    return { ok: true };
  }

  async listSessions(userId: string, refreshToken?: string) {
    const currentHash = refreshToken ? hashToken(refreshToken) : null;
    const rows = await this.repo.listActiveSessions(userId);
    return {
      items: rows.map((session) => ({
        id: session.id,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        current: Boolean(currentHash && session.refreshTokenHash === currentHash),
      })),
    };
  }

  async verifyEmail(userId: string, input: VerifyEmailInput) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (user.emailVerifiedAt) {
      throw new ValidationError('Email уже подтверждён');
    }

    const active = await this.repo.findLatestActiveVerificationCode(userId);
    if (!active) {
      throw new ValidationError('Код не найден. Запросите новый.');
    }
    if (active.expiresAt.getTime() < Date.now()) {
      throw new ValidationError('Срок действия кода истёк. Запросите новый.');
    }
    if (active.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      throw new ValidationError('Слишком много попыток. Запросите новый код.');
    }

    const codeHash = hashToken(input.code);
    if (codeHash !== active.codeHash) {
      await this.repo.incrementVerificationAttempts(active.id);
      throw new ValidationError('Неверный код');
    }

    await this.repo.consumeVerificationCode(active.id);
    const updated = await this.repo.markEmailVerified(userId);
    if (!updated) {
      throw new UnauthorizedError();
    }

    return publicUser(updated);
  }

  async resendVerification(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (user.emailVerifiedAt) {
      throw new ValidationError('Email уже подтверждён');
    }

    const active = await this.repo.findLatestActiveVerificationCode(userId);
    if (
      active &&
      Date.now() - active.createdAt.getTime() < VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      throw new ValidationError('Подождите минуту перед повторной отправкой');
    }

    const code = await this.issueVerificationCode(userId, user.email);
    return {
      ok: true as const,
      devVerificationCode: this.config.isDev ? code : undefined,
    };
  }

  async assertEmailVerified(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (!user.emailVerifiedAt) {
      throw new EmailNotVerifiedError();
    }
  }

  private async issueVerificationCode(userId: string, email: string) {
    const code = generateVerificationCode();
    await this.repo.invalidateVerificationCodes(userId);
    await this.repo.createVerificationCode({
      userId,
      codeHash: hashToken(code),
      expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
    });
    await this.email.sendVerificationCode({ to: email, code });
    return code;
  }

  private async issueSession(user: SessionUser, meta: { userAgent?: string; ip?: string }) {
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    const accessToken = await signAccessToken(this.config, {
      sub: user.id,
      role: user.role,
    });
    return {
      accessToken,
      refreshToken,
      expiresAt,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: publicUser(user),
    };
  }
}
