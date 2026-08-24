import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { trustScoreFromReviews } from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  conversationParticipants,
  conversations,
  listings,
  messages,
  reviews,
  users,
} from '../../../infrastructure/database/schema/index.js';

const participantA = alias(conversationParticipants, 'review_participant_a');
const participantB = alias(conversationParticipants, 'review_participant_b');

export class ReviewsRepository {
  constructor(private readonly db: Database) {}

  findListing(listingId: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });
  }

  findByAuthorAndListing(authorId: string, listingId: string) {
    return this.db.query.reviews.findFirst({
      where: and(eq(reviews.authorId, authorId), eq(reviews.listingId, listingId)),
    });
  }

  async hasMessagedSeller(listingId: string, authorId: string, sellerId: string) {
    const [conversation] = await this.db
      .select({ id: conversations.id })
      .from(conversations)
      .innerJoin(participantA, eq(participantA.conversationId, conversations.id))
      .innerJoin(participantB, eq(participantB.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.listingId, listingId),
          eq(participantA.userId, authorId),
          eq(participantB.userId, sellerId),
        ),
      )
      .limit(1);
    if (!conversation) return false;

    const [message] = await this.db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.conversationId, conversation.id), eq(messages.senderId, authorId)))
      .limit(1);
    return Boolean(message);
  }

  async stats(subjectId: string) {
    const [row] = await this.db
      .select({
        average: sql<string | number>`coalesce(avg(${reviews.rating}), 0)`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(reviews)
      .where(eq(reviews.subjectId, subjectId));
    return {
      average: Number(row?.average ?? 0),
      count: Number(row?.count ?? 0),
    };
  }

  listForSubject(subjectId: string, limit: number, offset: number) {
    return this.db
      .select({
        review: reviews,
        authorId: users.id,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        listingId: listings.id,
        listingTitle: listings.title,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.authorId))
      .leftJoin(listings, eq(listings.id, reviews.listingId))
      .where(eq(reviews.subjectId, subjectId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createAndRecount(input: {
    listingId: string;
    authorId: string;
    subjectId: string;
    rating: number;
    comment: string | null;
  }) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx.insert(reviews).values(input).returning();
      if (!row) {
        throw new Error('Failed to create review');
      }
      const [stats] = await tx
        .select({
          average: sql<string | number>`coalesce(avg(${reviews.rating}), 0)`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(reviews)
        .where(eq(reviews.subjectId, input.subjectId));
      const average = Number(stats?.average ?? 0);
      const count = Number(stats?.count ?? 0);
      await tx
        .update(users)
        .set({
          trustScore: trustScoreFromReviews(count > 0 ? average : null, count),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.subjectId));
      return { row, average, count };
    });
  }
}
