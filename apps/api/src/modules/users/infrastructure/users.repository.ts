import { eq } from 'drizzle-orm';
import type { Database } from '../../../infrastructure/database/client.js';
import { users } from '../../../infrastructure/database/schema/index.js';

export class UsersRepository {
  constructor(private readonly db: Database) {}

  findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
    });
  }

  findById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async setVerified(id: string, isVerified: boolean) {
    const [row] = await this.db
      .update(users)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row ?? null;
  }
}
