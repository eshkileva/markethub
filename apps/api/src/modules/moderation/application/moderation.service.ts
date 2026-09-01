import type { EventBus } from '../../../shared/events/event-bus.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';
import type { ModerationRepository } from '../infrastructure/moderation.repository.js';
import type { AiRiskLevel } from '@markethub/shared';

export class ModerationService {
  constructor(
    private readonly repo: ModerationRepository,
    private readonly events: EventBus,
  ) {}

  listQueue(input: { page: number; pageSize: number; riskLevel?: AiRiskLevel }) {
    return this.repo.listQueue(input);
  }

  async approve(listingId: string) {
    const listing = await this.repo.approve(listingId);
    if (!listing) {
      throw new ConflictError('Объявление не в очереди модерации');
    }

    await this.events.publish('ListingPublished', {
      listingId: listing.id,
      sellerId: listing.sellerId,
      country: listing.country,
    });

    return listing;
  }

  async reject(listingId: string, note: string) {
    const listing = await this.repo.reject(listingId, note);
    if (!listing) {
      throw new ConflictError('Объявление не в очереди модерации');
    }

    await this.events.publish('ListingRejected', {
      listingId: listing.id,
      sellerId: listing.sellerId,
      note,
    });

    return listing;
  }

  async requireQueued(listingId: string) {
    const listing = await this.repo.findById(listingId);
    if (!listing) throw new NotFoundError('Listing not found');
    if (listing.status !== 'pending_moderation') {
      throw new ConflictError('Объявление не в очереди модерации');
    }
    return listing;
  }
}
