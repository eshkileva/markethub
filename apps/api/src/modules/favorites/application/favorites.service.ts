import { eq } from 'drizzle-orm';
import { convertAmount, type CurrencyCode } from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import { listings } from '../../../infrastructure/database/schema/index.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import type { FavoritesRepository } from '../infrastructure/favorites.repository.js';

export class FavoritesService {
  constructor(
    private readonly repo: FavoritesRepository,
    private readonly db: Database,
  ) {}

  async add(userId: string, listingId: string) {
    const listing = await this.db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });
    if (!listing || listing.status !== 'published') {
      throw new NotFoundError('Listing not found');
    }
    await this.repo.add(userId, listingId);
    return { ok: true, listingId, favorited: true };
  }

  async remove(userId: string, listingId: string) {
    await this.repo.remove(userId, listingId);
    return { ok: true, listingId, favorited: false };
  }

  async ids(userId: string) {
    const rows = await this.repo.listIds(userId);
    return { ids: rows.map((row) => row.listingId) };
  }

  async list(userId: string) {
    const rows = await this.repo.listWithListings(userId);
    const listingIds = rows.map((row) => row.listing.id);
    const images = await this.repo.imagesFor(listingIds);
    const imagesByListing = new Map<string, string>();
    for (const image of images) {
      if (!imagesByListing.has(image.listingId)) {
        imagesByListing.set(image.listingId, image.url);
      }
    }

    return {
      items: rows.map(({ listing, sellerUsername, sellerDisplayName }) => {
        const price = Number(listing.price);
        const currency = listing.currency as CurrencyCode;
        return {
          id: listing.id,
          title: listing.title,
          price,
          currency,
          converted: {
            RUB: Math.round(convertAmount(price, currency, 'RUB')),
            BYN: Math.round(convertAmount(price, currency, 'BYN')),
            KZT: Math.round(convertAmount(price, currency, 'KZT')),
          },
          country: listing.country,
          city: listing.city,
          condition: listing.condition,
          publishedAt: listing.publishedAt?.toISOString() ?? null,
          imageUrl: imagesByListing.get(listing.id) ?? null,
          isFavorite: true,
          seller: {
            username: sellerUsername,
            displayName: sellerDisplayName,
          },
        };
      }),
    };
  }
}
