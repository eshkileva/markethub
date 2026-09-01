import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  conversationParticipants,
  conversations,
  categories,
  listingImages,
  listings,
  messages,
  users,
} from '../../../infrastructure/database/schema/index.js';

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === '23505',
  );
}

export class MessagingRepository {
  constructor(private readonly db: Database) {}

  findListing(listingId: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });
  }

  async findListingContext(listingId: string) {
    const listing = await this.findListing(listingId);
    if (!listing) return null;
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, listing.categoryId),
    });
    const parent = category?.parentId
      ? await this.db.query.categories.findFirst({
          where: eq(categories.id, category.parentId),
        })
      : null;
    return {
      id: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      categorySlug: category?.slug ?? null,
      parentCategorySlug: parent?.slug ?? null,
    };
  }

  async findBetween(listingId: string, buyerId: string) {
    const [row] = await this.db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId)))
      .limit(1);
    return row ?? null;
  }

  async createWithParticipants(listingId: string, buyerId: string, sellerId: string) {
    try {
      return await this.db.transaction(async (tx) => {
        const [conversation] = await tx
          .insert(conversations)
          .values({ listingId, buyerId })
          .returning();
        if (!conversation) {
          throw new Error('Failed to create conversation');
        }
        await tx.insert(conversationParticipants).values([
          { conversationId: conversation.id, userId: buyerId, lastReadAt: new Date() },
          { conversationId: conversation.id, userId: sellerId },
        ]);
        return conversation;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return this.findBetween(listingId, buyerId);
      }
      throw error;
    }
  }

  findConversation(id: string) {
    return this.db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
  }

  listParticipants(conversationId: string) {
    return this.db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
  }

  async isParticipant(conversationId: string, userId: string) {
    const [row] = await this.db
      .select({ id: conversationParticipants.id })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  listForUser(userId: string) {
    return this.db
      .select({
        conversation: conversations,
        lastReadAt: conversationParticipants.lastReadAt,
        listing: listings,
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
      .innerJoin(listings, eq(listings.id, conversations.listingId))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  listForBuyer(userId: string) {
    return this.db
      .select({
        conversation: conversations,
        lastReadAt: conversationParticipants.lastReadAt,
        listing: listings,
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
      .innerJoin(listings, eq(listings.id, conversations.listingId))
      .where(and(eq(conversationParticipants.userId, userId), ne(listings.sellerId, userId)))
      .orderBy(desc(conversations.updatedAt));
  }

  async isParticipantOnListing(listingId: string, userId: string) {
    const [row] = await this.db
      .select({ id: conversationParticipants.id })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
      .where(
        and(eq(conversations.listingId, listingId), eq(conversationParticipants.userId, userId)),
      )
      .limit(1);
    return Boolean(row);
  }

  async countUnread(userId: string) {
    const [row] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        eq(conversationParticipants.conversationId, messages.conversationId),
      )
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          ne(messages.senderId, userId),
          or(
            isNull(conversationParticipants.lastReadAt),
            gt(messages.createdAt, conversationParticipants.lastReadAt),
          ),
        ),
      );
    return row?.count ?? 0;
  }

  participantsFor(conversationIds: string[]) {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.db
      .select({
        conversationId: conversationParticipants.conversationId,
        userId: conversationParticipants.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(inArray(conversationParticipants.conversationId, conversationIds));
  }

  imagesFor(listingIds: string[]) {
    if (listingIds.length === 0) return Promise.resolve([]);
    return this.db.query.listingImages.findMany({
      where: inArray(listingImages.listingId, listingIds),
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
    });
  }

  messagesFor(conversationIds: string[]) {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(desc(messages.createdAt));
  }

  listMessages(conversationId: string, limit = 100) {
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(limit);
  }

  async insertMessage(conversationId: string, senderId: string, body: string) {
    const [message] = await this.db
      .insert(messages)
      .values({ conversationId, senderId, body })
      .returning();
    if (!message) {
      throw new Error('Failed to insert message');
    }
    await this.db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
    await this.db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, senderId),
        ),
      );
    return message;
  }

  markRead(conversationId: string, userId: string) {
    return this.db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }
}
