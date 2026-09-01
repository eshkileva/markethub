import { and, eq, inArray, sql } from 'drizzle-orm';
import type { CurrencyCode } from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  categories,
  categoryAttributes,
  listingImages,
  listings,
  users,
} from '../../../infrastructure/database/schema/index.js';

export type LeafCategory = {
  id: string;
  slug: string;
  nameRu: string;
  parentSlug: string | null;
};

export class ListingCopilotRepository {
  constructor(private readonly db: Database) {}

  async listLeafCategories(): Promise<LeafCategory[]> {
    const rows = await this.db.query.categories.findMany({
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
    });
    const childrenByParent = new Map<string, number>();
    for (const row of rows) {
      if (row.parentId) {
        childrenByParent.set(row.parentId, (childrenByParent.get(row.parentId) ?? 0) + 1);
      }
    }
    const byId = new Map(rows.map((row) => [row.id, row]));
    return rows
      .filter((row) => !childrenByParent.has(row.id))
      .map((row) => ({
        id: row.id,
        slug: row.slug,
        nameRu: row.nameRu,
        parentSlug: row.parentId ? (byId.get(row.parentId)?.slug ?? null) : null,
      }));
  }

  findCategoryBySlug(slug: string) {
    return this.db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
  }

  listCategoryAttributes(categoryId: string) {
    return this.db.query.categoryAttributes.findMany({
      where: eq(categoryAttributes.categoryId, categoryId),
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
    });
  }

  async priceStats(input: {
    categoryId: string;
    country: string;
    currency: CurrencyCode;
  }) {
    const [row] = await this.db
      .select({
        min: sql<number | null>`min(${listings.price}::numeric)`,
        max: sql<number | null>`max(${listings.price}::numeric)`,
        median: sql<number | null>`percentile_cont(0.5) within group (order by ${listings.price}::numeric)`,
        sampleSize: sql<number>`count(*)::int`,
      })
      .from(listings)
      .where(
        and(
          eq(listings.categoryId, input.categoryId),
          eq(listings.country, input.country),
          eq(listings.currency, input.currency),
          inArray(listings.status, ['published', 'reserved', 'sold']),
        ),
      );

    return {
      min: row?.min != null ? Number(row.min) : null,
      max: row?.max != null ? Number(row.max) : null,
      median: row?.median != null ? Number(row.median) : null,
      sampleSize: row?.sampleSize ?? 0,
    };
  }

  async sellerSignals(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) return null;

    const [listingCountRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.sellerId, userId));

    return {
      trustScore: user.trustScore,
      emailVerified: Boolean(user.emailVerifiedAt),
      isVerified: user.isVerified,
      accountAgeDays: Math.max(
        0,
        Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      ),
      listingCount: listingCountRow?.count ?? 0,
    };
  }

  async findListingForAssessment(listingId: string) {
    const listing = await this.db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });
    if (!listing) return null;

    const [cover] = await this.db.query.listingImages.findMany({
      where: eq(listingImages.listingId, listingId),
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
      limit: 1,
    });

    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, listing.categoryId),
    });

    return {
      id: listing.id,
      sellerId: listing.sellerId,
      categoryId: listing.categoryId,
      categorySlug: category?.slug ?? null,
      title: listing.title,
      description: listing.description,
      price: Number(listing.price),
      currency: listing.currency as CurrencyCode,
      country: listing.country,
      condition: listing.condition,
      coverImageUrl: cover?.url ?? null,
    };
  }
}
