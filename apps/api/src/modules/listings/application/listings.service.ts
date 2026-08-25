import { MAX_LISTING_IMAGES, type CountryCode, type createListingSchema } from '@markethub/shared';
import type { z } from 'zod';
import type { EventBus } from '../../../shared/events/event-bus.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/app-error.js';
import type { ListingsRepository } from '../infrastructure/listings.repository.js';
import type { GeoService } from '../../geo/application/geo.service.js';

type CreateListingInput = z.infer<typeof createListingSchema>;

export class ListingsService {
  constructor(
    private readonly repo: ListingsRepository,
    private readonly events: EventBus,
    private readonly geo: GeoService,
  ) {}

  async createDraft(sellerId: string, input: CreateListingInput) {
    await this.geo.assertCity(input.country as CountryCode, input.city);
    await this.assertLeafCategory(input.categoryId);
    const listing = await this.repo.create(sellerId, input);
    return listing;
  }

  async update(sellerId: string, listingId: string, input: CreateListingInput) {
    await this.geo.assertCity(input.country as CountryCode, input.city);
    await this.assertLeafCategory(input.categoryId);
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
    const existing = await this.requireOwned(sellerId, listingId);
    if (!['draft', 'rejected', 'archived'].includes(existing.status)) {
      throw new ConflictError('Объявление нельзя опубликовать из текущего статуса');
    }

    const listing = await this.repo.publishIfReady(listingId, ['draft', 'rejected', 'archived']);
    if (!listing) {
      throw new ConflictError('Объявление нельзя опубликовать из текущего статуса');
    }

    await this.events.publish('ListingPublished', {
      listingId: listing.id,
      sellerId,
      country: listing.country,
    });

    return listing;
  }

  async attachImage(sellerId: string, listingId: string, url: string) {
    await this.requireOwned(sellerId, listingId);
    const image = await this.repo.addImage(listingId, url);
    if (!image) {
      throw new ValidationError(`Maximum ${MAX_LISTING_IMAGES} images per listing`);
    }
    return image;
  }

  async archive(sellerId: string, listingId: string) {
    return this.transition(
      sellerId,
      listingId,
      ['published', 'reserved'],
      'archived',
      'Только активные объявления можно скрыть',
    );
  }

  async reserve(sellerId: string, listingId: string) {
    return this.transition(
      sellerId,
      listingId,
      ['published'],
      'reserved',
      'Забронировать можно только опубликованное объявление',
    );
  }

  async sell(sellerId: string, listingId: string) {
    const listing = await this.transition(
      sellerId,
      listingId,
      ['published', 'reserved'],
      'sold',
      'Продать можно только активное объявление',
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
      'Вернуть в продажу можно только забронированное или проданное объявление',
    );
  }

  private async transition(
    sellerId: string,
    listingId: string,
    from: Array<'published' | 'reserved' | 'sold'>,
    to: 'published' | 'reserved' | 'sold' | 'archived',
    error: string,
  ) {
    await this.requireOwned(sellerId, listingId);
    const listing = await this.repo.setStatusIf(listingId, from, to);
    if (!listing) throw new ConflictError(error);
    return listing;
  }

  async removeImage(sellerId: string, listingId: string, imageId: string) {
    const existing = await this.requireOwned(sellerId, listingId);
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

  private async assertLeafCategory(categoryId: string) {
    const leaf = await this.repo.isLeafCategory(categoryId);
    if (leaf === null) throw new ValidationError('Категория не найдена');
    if (!leaf) throw new ValidationError('Выберите подкатегорию');
  }

  private async requireOwned(sellerId: string, listingId: string) {
    const existing = await this.repo.findById(listingId);
    if (!existing) throw new NotFoundError('Listing not found');
    if (existing.sellerId !== sellerId) throw new ForbiddenError();
    return existing;
  }
}
