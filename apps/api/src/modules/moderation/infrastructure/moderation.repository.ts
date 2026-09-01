import { and, desc, eq, ilike, inArray, ne, sql } from 'drizzle-orm';
import type { AiRiskLevel } from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import { listingImages, listings, users } from '../../../infrastructure/database/schema/index.js';

const riskOrder = sql`case ${listings.aiRiskLevel}
  when 'high' then 0
  when 'medium' then 1
  when 'low' then 2
  else 3
end`;

export class ModerationRepository {
  constructor(private readonly db: Database) {}

  async listQueue(input: { page: number; pageSize: number; riskLevel?: AiRiskLevel }) {
    const conditions = [eq(listings.status, 'pending_moderation')];
    if (input.riskLevel) {
      conditions.push(eq(listings.aiRiskLevel, input.riskLevel));
    }

    const whereClause = and(...conditions);
    const [countRow] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(listings)
      .where(whereClause);

    const offset = (input.page - 1) * input.pageSize;
    const rows = await this.db
      .select({
        listing: listings,
        sellerUsername: users.username,
        sellerDisplayName: users.displayName,
        sellerTrustScore: users.trustScore,
        sellerVerified: users.isVerified,
        sellerEmailVerifiedAt: users.emailVerifiedAt,
        sellerCreatedAt: users.createdAt,
        sellerListingCount: sql<number>`(
          select count(*)::int from listings l2 where l2.seller_id = ${users.id}
        )`,
      })
      .from(listings)
      .innerJoin(users, eq(users.id, listings.sellerId))
      .where(whereClause)
      .orderBy(riskOrder, desc(listings.createdAt))
      .limit(input.pageSize)
      .offset(offset);

    const listingIds = rows.map((row) => row.listing.id);
    const images =
      listingIds.length === 0
        ? []
        : await this.db.query.listingImages.findMany({
            where: (table, { inArray: inArr }) => inArr(table.listingId, listingIds),
            orderBy: (table, { asc }) => [asc(table.sortOrder)],
          });

    const imageByListing = new Map<string, string>();
    for (const image of images) {
      if (!imageByListing.has(image.listingId)) {
        imageByListing.set(image.listingId, image.url);
      }
    }

    const items = await Promise.all(
      rows.map(async (row) => ({
        listing: row.listing,
        imageUrl: imageByListing.get(row.listing.id) ?? null,
        seller: {
          id: row.listing.sellerId,
          username: row.sellerUsername,
          displayName: row.sellerDisplayName,
          trustScore: row.sellerTrustScore,
          isVerified: row.sellerVerified,
          emailVerified: Boolean(row.sellerEmailVerifiedAt),
          accountAgeDays: Math.max(
            0,
            Math.floor((Date.now() - row.sellerCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
          ),
          listingCount: row.sellerListingCount,
        },
        duplicateHints: await this.findDuplicateHints(row.listing),
      })),
    );

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total: Number(countRow?.count ?? 0),
    };
  }

  findById(id: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, id),
    });
  }

  async approve(listingId: string) {
    const [listing] = await this.db
      .update(listings)
      .set({
        status: 'published',
        publishedAt: new Date(),
        moderationNote: null,
        updatedAt: new Date(),
      })
      .where(and(eq(listings.id, listingId), eq(listings.status, 'pending_moderation')))
      .returning();
    return listing ?? null;
  }

  async reject(listingId: string, note: string) {
    const [listing] = await this.db
      .update(listings)
      .set({
        status: 'rejected',
        publishedAt: null,
        moderationNote: note,
        updatedAt: new Date(),
      })
      .where(and(eq(listings.id, listingId), eq(listings.status, 'pending_moderation')))
      .returning();
    return listing ?? null;
  }

  private async findDuplicateHints(listing: typeof listings.$inferSelect): Promise<string[]> {
    const hints: string[] = [];
    const price = Number(listing.price);
    const minPrice = price * 0.8;
    const maxPrice = price * 1.2;

    const similarTitle = await this.db
      .select({ id: listings.id, title: listings.title })
      .from(listings)
      .where(
        and(
          ne(listings.id, listing.id),
          eq(listings.sellerId, listing.sellerId),
          ilike(listings.title, `%${listing.title.slice(0, 24)}%`),
          inArray(listings.status, ['published', 'pending_moderation', 'reserved']),
        ),
      )
      .limit(3);

    if (similarTitle.length > 0) {
      hints.push('У продавца уже есть похожие объявления с близким заголовком');
    }

    const [cheapDuplicate] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(
        and(
          ne(listings.id, listing.id),
          eq(listings.categoryId, listing.categoryId),
          eq(listings.country, listing.country),
          eq(listings.currency, listing.currency),
          sql`${listings.price}::numeric between ${minPrice} and ${maxPrice}`,
          inArray(listings.status, ['published', 'pending_moderation']),
          sql`${listings.createdAt} > now() - interval '14 days'`,
        ),
      );

    if ((cheapDuplicate?.count ?? 0) >= 3) {
      hints.push('Много похожих объявлений в категории за последние 2 недели');
    }

    if (price > 0 && listing.aiRiskLevel === 'high') {
      hints.push('AI пометил объявление как высокий риск — проверьте фото и цену');
    }

    return hints.slice(0, 4);
  }
}
