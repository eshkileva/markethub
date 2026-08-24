import { and, desc, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  favorites,
  listingImages,
  listings,
  users,
} from '../../../infrastructure/database/schema/index.js';

export class FavoritesRepository {
  constructor(private readonly db: Database) {}

  async add(userId: string, listingId: string) {
    const [row] = await this.db
      .insert(favorites)
      .values({ userId, listingId })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  }

  async remove(userId: string, listingId: string) {
    const deleted = await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
      .returning({ id: favorites.id });
    return deleted.length > 0;
  }

  listIds(userId: string, listingIds?: string[]) {
    const conditions = [eq(favorites.userId, userId)];
    if (listingIds && listingIds.length > 0) {
      conditions.push(inArray(favorites.listingId, listingIds));
    }
    return this.db
      .select({ listingId: favorites.listingId })
      .from(favorites)
      .where(and(...conditions));
  }

  listWithListings(userId: string) {
    return this.db
      .select({
        favoriteId: favorites.id,
        createdAt: favorites.createdAt,
        listing: listings,
        sellerUsername: users.username,
        sellerDisplayName: users.displayName,
      })
      .from(favorites)
      .innerJoin(listings, eq(listings.id, favorites.listingId))
      .innerJoin(users, eq(users.id, listings.sellerId))
      .where(and(eq(favorites.userId, userId), eq(listings.status, 'published')))
      .orderBy(desc(favorites.createdAt));
  }

  imagesFor(listingIds: string[]) {
    if (listingIds.length === 0) return Promise.resolve([]);
    return this.db.query.listingImages.findMany({
      where: inArray(listingImages.listingId, listingIds),
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
    });
  }
}
