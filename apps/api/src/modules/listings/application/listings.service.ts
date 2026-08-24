import { MAX_LISTING_IMAGES, type createListingSchema } from '@markethub/shared';
import type { z } from 'zod';
import type { EventBus } from '../../../shared/events/event-bus.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/app-error.js';
import type { ListingsRepository } from '../infrastructure/listings.repository.js';

type CreateListingInput = z.infer<typeof createListingSchema>;

export class ListingsService {
  constructor(
    private readonly repo: ListingsRepository,
    private readonly events: EventBus,
  ) {}

  async createDraft(sellerId: string, input: CreateListingInput) {
    const listing = await this.repo.create(sellerId, input);
    return listing;
  }

  async update(sellerId: string, listingId: string, input: CreateListingInput) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();
    if (existing.status === 'sold') {
      throw new ValidationError('Sold listings cannot be edited');
    }

    const listing = await this.repo.update(listingId, input);
    if (!listing) throw new NotFoundError('Listing not found');

    await this.events.publish('ListingUpdated', {
      listingId: listing.id,
      sellerId,
    });

    return listing;
  }

  async publish(sellerId: string, listingId: string) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();
    if (!['draft', 'rejected', 'archived'].includes(existing.status)) {
      throw new ValidationError('Listing cannot be published from current status');
    }

    const images = await this.repo.listImages(listingId);
    if (images.length === 0) {
      throw new ValidationError('Add at least one image before publishing');
    }

    const defs = await this.repo.listCategoryAttributes(existing.categoryId);
    const values = await this.repo.listAttributeValues(listingId);
    const filled = new Set(
      values.filter((row) => row.value.trim().length > 0).map((row) => row.attributeId),
    );
    const missing = defs.filter((def) => def.required && !filled.has(def.id));
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required attributes: ${missing.map((item) => item.labelRu).join(', ')}`,
      );
    }

    const listing = await this.repo.publish(listingId);
    if (!listing) throw new NotFoundError('Listing not found');

    await this.events.publish('ListingPublished', {
      listingId: listing.id,
      sellerId,
      country: listing.country,
    });

    return listing;
  }

  async attachImage(sellerId: string, listingId: string, url: string) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();

    const images = await this.repo.listImages(listingId);
    if (images.length >= MAX_LISTING_IMAGES) {
      throw new ValidationError(`Maximum ${MAX_LISTING_IMAGES} images per listing`);
    }
    return this.repo.addImage(listingId, url, images.length);
  }

  async archive(sellerId: string, listingId: string) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();
    if (!['published', 'reserved'].includes(existing.status)) {
      throw new ValidationError('Only active listings can be archived');
    }
    const listing = await this.repo.setStatus(listingId, 'archived');
    if (!listing) throw new NotFoundError('Listing not found');
    return listing;
  }

  async reserve(sellerId: string, listingId: string) {
    return this.transition(
      sellerId,
      listingId,
      ['published'],
      'reserved',
      'Only published listings can be reserved',
    );
  }

  async sell(sellerId: string, listingId: string) {
    const listing = await this.transition(
      sellerId,
      listingId,
      ['published', 'reserved'],
      'sold',
      'Only active listings can be marked as sold',
    );
    await this.events.publish('ListingSold', {
      listingId: listing.id,
      sellerId,
    });
    return listing;
  }

  async relist(sellerId: string, listingId: string) {
    return this.transition(
      sellerId,
      listingId,
      ['reserved', 'sold'],
      'published',
      'Only reserved or sold listings can be relisted',
    );
  }

  private async transition(
    sellerId: string,
    listingId: string,
    from: Array<'published' | 'reserved' | 'sold'>,
    to: 'published' | 'reserved' | 'sold',
    error: string,
  ) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();
    if (!(from as string[]).includes(existing.status)) {
      throw new ValidationError(error);
    }
    const listing = await this.repo.setStatus(listingId, to);
    if (!listing) throw new NotFoundError('Listing not found');
    return listing;
  }

  async removeImage(sellerId: string, listingId: string, imageId: string) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();
    if (existing.status === 'sold') {
      throw new ValidationError('Sold listings cannot be edited');
    }
    const images = await this.repo.listImages(listingId);
    if (['published', 'reserved'].includes(existing.status) && images.length <= 1) {
      throw new ValidationError('Keep at least one image on an active listing');
    }
    const removed = await this.repo.removeImage(listingId, imageId);
    if (!removed) throw new NotFoundError('Image not found');
    return removed;
  }
}
