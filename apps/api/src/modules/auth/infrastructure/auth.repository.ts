import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../../infrastructure/database/client.js';
import { authIdentities, sessions, users } from '../../../infrastructure/database/schema/index.js';

export class AuthRepository {
  constructor(private readonly db: Database) {}

  findUserByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
  }

  findUserById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  findUserByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
    });
  }

  updateUser(
    userId: string,
    input: {
      displayName?: string | null;
      bio?: string | null;
      city?: string | null;
      country?: string;
      avatarUrl?: string | null;
      username?: string;
    },
  ) {
    return this.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()
      .then((rows) => rows[0] ?? null);
  }

  updatePasswordHash(identityId: string, passwordHash: string) {
    return this.db
      .update(authIdentities)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(authIdentities.id, identityId));
  }

  listActiveSessions(userId: string) {
    return this.db.query.sessions.findMany({
      where: and(eq(sessions.userId, userId), isNull(sessions.revokedAt)),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  }

  findEmailIdentity(userId: string) {
    return this.db.query.authIdentities.findFirst({
      where: and(eq(authIdentities.userId, userId), eq(authIdentities.provider, 'email')),
    });
  }

  async createUserWithEmail(input: {
    email: string;
    username: string;
    displayName?: string;
    country: string;
    passwordHash: string;
  }) {
    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          username: input.username.toLowerCase(),
          displayName: input.displayName ?? input.username,
          country: input.country,
        })
        .returning();

      if (!user) {
        throw new Error('Failed to create user');
      }

      await tx.insert(authIdentities).values({
        userId: user.id,
        provider: 'email',
        providerAccountId: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
      });

      return user;
    });
  }

  createSession(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }) {
    return this.db
      .insert(sessions)
      .values(input)
      .returning()
      .then((rows) => rows[0]!);
  }

  findActiveSessionByHash(refreshTokenHash: string) {
    return this.db.query.sessions.findFirst({
      where: and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)),
    });
  }

  async revokeSession(sessionId: string) {
    await this.db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  async revokeAllUserSessions(userId: string) {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  listIdentities(userId: string) {
    return this.db.query.authIdentities.findMany({
      where: eq(authIdentities.userId, userId),
    });
  }
}
