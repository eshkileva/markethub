import { trustScoreFromReviews } from '@markethub/shared';
import type { EventBus } from '../../../shared/events/event-bus.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/app-error.js';
import type { ReviewsRepository } from '../infrastructure/reviews.repository.js';

function serializeReview(row: {
  id: string;
  listingId: string | null;
  authorId: string;
  subjectId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    listingId: row.listingId,
    authorId: row.authorId,
    subjectId: row.subjectId,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  };
}

export class ReviewsService {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly events: EventBus,
  ) {}

  async eligibility(authorId: string, listingId: string) {
    const listing = await this.repo.findListing(listingId);
    if (!listing) {
      return { canReview: false, reason: 'not_found' as const, myReview: null };
    }
    const existing = await this.repo.findByAuthorAndListing(authorId, listingId);
    const myReview = existing ? serializeReview(existing) : null;
    if (listing.sellerId === authorId) {
      return { canReview: false, reason: 'own_listing' as const, myReview };
    }
    if (existing) {
      return { canReview: false, reason: 'already_reviewed' as const, myReview };
    }
    const contacted = await this.repo.hasMessagedSeller(listingId, authorId, listing.sellerId);
    if (!contacted) {
      return { canReview: false, reason: 'no_conversation' as const, myReview: null };
    }
    return { canReview: true, reason: 'ok' as const, myReview: null };
  }

  async create(authorId: string, input: { listingId: string; rating: number; comment?: string }) {
    const listing = await this.repo.findListing(input.listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    if (listing.sellerId === authorId) {
      throw new ForbiddenError('You cannot review your own listing');
    }
    const existing = await this.repo.findByAuthorAndListing(authorId, input.listingId);
    if (existing) {
      throw new ConflictError('You already reviewed this listing');
    }
    const contacted = await this.repo.hasMessagedSeller(
      input.listingId,
      authorId,
      listing.sellerId,
    );
    if (!contacted) {
      throw new ValidationError('Write to the seller before leaving a review');
    }

    const comment = input.comment?.trim() ? input.comment.trim() : null;
    const { row } = await this.repo.createAndRecount({
      listingId: input.listingId,
      authorId,
      subjectId: listing.sellerId,
      rating: input.rating,
      comment,
    });
    await this.events.publish('ReviewCreated', {
      reviewId: row.id,
      authorId,
      subjectId: listing.sellerId,
      listingId: input.listingId,
      rating: input.rating,
    });
    return serializeReview(row);
  }

  async listForUser(subjectId: string, page: number, pageSize: number) {
    const stats = await this.repo.stats(subjectId);
    const rows = await this.repo.listForSubject(subjectId, pageSize, (page - 1) * pageSize);
    const average = stats.count > 0 ? Math.round(stats.average * 10) / 10 : null;
    return {
      average,
      count: stats.count,
      trustScore: trustScoreFromReviews(stats.count > 0 ? stats.average : null, stats.count),
      page,
      pageSize,
      items: rows.map((row) => ({
        id: row.review.id,
        rating: row.review.rating,
        comment: row.review.comment,
        createdAt: row.review.createdAt.toISOString(),
        author: {
          id: row.authorId,
          username: row.authorUsername,
          displayName: row.authorDisplayName,
          avatarUrl: row.authorAvatarUrl,
        },
        listing: row.listingId
          ? { id: row.listingId, title: row.listingTitle ?? 'Объявление' }
          : null,
      })),
    };
  }
}
