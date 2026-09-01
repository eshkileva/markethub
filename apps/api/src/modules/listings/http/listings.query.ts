import { and, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';
import {
  convertedAmounts,
  type CurrencyCode,
  type ListingStatus,
  type PriceVerdict,
  type RatesToRub,
  listingFilterSchema,
} from '@markethub/shared';
import type { z } from 'zod';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  categoryAttributes,
  categories,
  favorites,
  listingAttributes,
  listingImages,
  listings,
  users,
} from '../../../infrastructure/database/schema/index.js';
import { listingCategoryIds } from '../../categories/application/category-tree.js';
import { serializeListing } from './listings.serialize.js';

type CatalogQuery = z.infer<typeof listingFilterSchema>;

function priceVerdictFromAssessment(
  assessment: Record<string, unknown> | null | undefined,
): PriceVerdict | null {
  const price = assessment?.price;
  if (!price || typeof price !== 'object') return null;
  const verdict = (price as { verdict?: unknown }).verdict;
  if (verdict === 'low' || verdict === 'fair' || verdict === 'high' || verdict === 'unknown') {
    return verdict;
  }
  return null;
}

function parseAttrFilters(raw: string[] | undefined): Array<{ key: string; value: string }> {
  if (!raw?.length) return [];
  const seen = new Map<string, string>();
  for (const item of raw) {
    const sep = item.indexOf(':');
    if (sep <= 0) continue;
    const key = item.slice(0, sep).trim();
    const value = item.slice(sep + 1).trim();
    if (!key || !value) continue;
    seen.set(key, value);
  }
  return [...seen].map(([key, value]) => ({ key, value }));
}

export async function listCatalog(
  db: Database,
  query: CatalogQuery,
  viewerId: string | null,
  rates?: RatesToRub,
) {
  const conditions = [eq(listings.status, 'published')];

  if (query.country) conditions.push(eq(listings.country, query.country));
  if (query.sellerId) conditions.push(eq(listings.sellerId, query.sellerId));
  if (query.categoryId) {
    const tree = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories);
    const ids = listingCategoryIds(tree, query.categoryId);
    conditions.push(inArray(listings.categoryId, ids));
  }
  if (query.city) conditions.push(ilike(listings.city, `%${query.city}%`));
  if (query.condition) conditions.push(eq(listings.condition, query.condition));
  if (query.currency) conditions.push(eq(listings.currency, query.currency));
  if (query.minPrice !== undefined) {
    conditions.push(gte(listings.price, String(query.minPrice)));
  }
  if (query.maxPrice !== undefined) {
    conditions.push(lte(listings.price, String(query.maxPrice)));
  }
  if (query.delivery) {
    conditions.push(sql`${listings.deliveryModes} @> ${JSON.stringify([query.delivery])}::jsonb`);
  }
  if (query.q) {
    conditions.push(
      sql`(${listings.title} ILIKE ${`%${query.q}%`} OR ${listings.description} ILIKE ${`%${query.q}%`})`,
    );
  }
  for (const filter of parseAttrFilters(query.attr)) {
    conditions.push(
      sql`exists (
        select 1
        from listing_attributes la
        inner join category_attributes ca on ca.id = la.attribute_id
        where la.listing_id = ${listings.id}
          and ca.key = ${filter.key}
          and la.value ilike ${`%${filter.value}%`}
      )`,
    );
  }

  const whereClause = and(...conditions);
  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(listings)
    .where(whereClause);
  const offset = (query.page - 1) * query.pageSize;
  const base = db
    .select({
      listing: listings,
      sellerUsername: users.username,
      sellerDisplayName: users.displayName,
    })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.sellerId))
    .where(whereClause);

  const rows =
    query.sort === 'price_asc'
      ? await base.orderBy(listings.price).limit(query.pageSize).offset(offset)
      : query.sort === 'price_desc'
        ? await base.orderBy(desc(listings.price)).limit(query.pageSize).offset(offset)
        : await base.orderBy(desc(listings.publishedAt)).limit(query.pageSize).offset(offset);

  const listingIds = rows.map((row) => row.listing.id);
  const images =
    listingIds.length === 0
      ? []
      : await db.query.listingImages.findMany({
          where: (table, { inArray: inArr }) => inArr(table.listingId, listingIds),
          orderBy: (table, { asc }) => [asc(table.sortOrder)],
        });

  const imagesByListing = new Map<string, typeof images>();
  for (const image of images) {
    const list = imagesByListing.get(image.listingId) ?? [];
    list.push(image);
    imagesByListing.set(image.listingId, list);
  }

  const favoriteIds = new Set<string>();
  if (viewerId && listingIds.length > 0) {
    const favRows = await db
      .select({ listingId: favorites.listingId })
      .from(favorites)
      .where(and(eq(favorites.userId, viewerId), inArray(favorites.listingId, listingIds)));
    for (const row of favRows) favoriteIds.add(row.listingId);
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
        converted: convertedAmounts(price, currency, rates),
        country: listing.country,
        city: listing.city,
        condition: listing.condition,
        publishedAt: listing.publishedAt?.toISOString() ?? null,
        imageUrl: imagesByListing.get(listing.id)?.[0]?.url ?? null,
        listingTrustScore: listing.listingTrustScore ?? null,
        aiRiskLevel: listing.aiRiskLevel ?? null,
        priceVerdict: priceVerdictFromAssessment(listing.aiAssessment),
        isFavorite: favoriteIds.has(listing.id),
        seller: {
          username: sellerUsername,
          displayName: sellerDisplayName,
        },
      };
    }),
    page: query.page,
    pageSize: query.pageSize,
    total: Number(countRow?.count ?? 0),
  };
}

export async function listMine(db: Database, sellerId: string, status: ListingStatus | undefined) {
  const rows = await db.query.listings.findMany({
    where: status
      ? and(eq(listings.sellerId, sellerId), eq(listings.status, status))
      : eq(listings.sellerId, sellerId),
    orderBy: (table, { desc: d }) => [d(table.updatedAt)],
  });
  const listingIds = rows.map((row) => row.id);
  const images =
    listingIds.length === 0
      ? []
      : await db.query.listingImages.findMany({
          where: (table, { inArray: inArr }) => inArr(table.listingId, listingIds),
          orderBy: (table, { asc }) => [asc(table.sortOrder)],
        });
  const imagesByListing = new Map<string, typeof images>();
  for (const image of images) {
    const list = imagesByListing.get(image.listingId) ?? [];
    list.push(image);
    imagesByListing.set(image.listingId, list);
  }
  return {
    items: rows.map((listing) => {
      const listingImagesForRow = imagesByListing.get(listing.id) ?? [];
      return {
        ...serializeListing(listing),
        imageUrl: listingImagesForRow[0]?.url ?? null,
        imageCount: listingImagesForRow.length,
      };
    }),
  };
}

export function findListingById(db: Database, id: string) {
  return db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
}

export async function getListingDetail(
  db: Database,
  listing: NonNullable<Awaited<ReturnType<typeof findListingById>>>,
  viewerId: string | null,
  rates?: RatesToRub,
) {
  const id = listing.id;
  let isFavorite = false;
  if (viewerId) {
    const [fav] = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, viewerId), eq(favorites.listingId, id)))
      .limit(1);
    isFavorite = Boolean(fav);
  }

  const seller = await db.query.users.findFirst({
    where: eq(users.id, listing.sellerId),
  });
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, listing.categoryId),
  });
  const images = await db.query.listingImages.findMany({
    where: eq(listingImages.listingId, id),
    orderBy: (table, { asc }) => [asc(table.sortOrder)],
  });
  const attributes = await db
    .select({
      attributeId: listingAttributes.attributeId,
      value: listingAttributes.value,
      labelRu: categoryAttributes.labelRu,
      sortOrder: categoryAttributes.sortOrder,
    })
    .from(listingAttributes)
    .leftJoin(categoryAttributes, eq(categoryAttributes.id, listingAttributes.attributeId))
    .where(eq(listingAttributes.listingId, id))
    .orderBy(categoryAttributes.sortOrder);

  const price = Number(listing.price);
  const currency = listing.currency as CurrencyCode;

  return {
    ...serializeListing(listing),
    converted: convertedAmounts(price, currency, rates),
    images: images.map((img) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
    attributes: attributes.map((attr) => ({
      attributeId: attr.attributeId,
      value: attr.value,
      labelRu: attr.labelRu ?? 'Характеристика',
    })),
    isFavorite,
    categorySlug: category?.slug ?? null,
    seller: seller
      ? {
          id: seller.id,
          username: seller.username,
          displayName: seller.displayName,
          avatarUrl: seller.avatarUrl,
          country: seller.country,
          trustScore: seller.trustScore,
          isVerified: seller.isVerified,
        }
      : null,
  };
}
