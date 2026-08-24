import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import type { NotificationType } from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  conversationParticipants,
  conversations,
  listings,
  messages,
  notifications,
  users,
} from '../../../infrastructure/database/schema/index.js';

export class NotificationsRepository {
  constructor(private readonly db: Database) {}

  create(input: { userId: string; type: NotificationType; payload: string }) {
    return this.db
      .insert(notifications)
      .values(input)
      .returning()
      .then((rows) => rows[0]!);
  }

  createMany(rows: Array<{ userId: string; type: NotificationType; payload: string }>) {
    if (rows.length === 0) return Promise.resolve([]);
    return this.db.insert(notifications).values(rows).returning();
  }

  async countForUser(userId: string) {
    const [row] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notifications)
      .where(eq(notifications.userId, userId));
    return Number(row?.count ?? 0);
  }

  async countUnread(userId: string) {
    const [row] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return Number(row?.count ?? 0);
  }

  listForUser(userId: string, limit: number, offset: number) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  findById(id: string) {
    return this.db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  }

  async markRead(id: string, userId: string) {
    const [row] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  async markAllRead(userId: string) {
    const rows = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    return rows.length;
  }

  findUser(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  findListing(id: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, id),
    });
  }

  findMessage(id: string) {
    return this.db.query.messages.findFirst({
      where: eq(messages.id, id),
    });
  }

  findConversation(id: string) {
    return this.db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
  }

  listParticipantUserIds(conversationId: string) {
    return this.db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
  }

  listBuyerUserIdsForListing(listingId: string, sellerId: string) {
    return this.db
      .selectDistinct({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
      .where(
        and(eq(conversations.listingId, listingId), ne(conversationParticipants.userId, sellerId)),
      );
  }
}
