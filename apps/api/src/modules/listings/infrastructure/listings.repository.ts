import { and, eq, inArray, sql } from 'drizzle-orm';
import { MAX_LISTING_IMAGES, type createListingSchema } from '@markethub/shared';
import type { z } from 'zod';
import type { Database } from '../../../infrastructure/database/client.js';
import { ValidationError } from '../../../shared/errors/app-error.js';
import {
  listingAttributes,
  listingImages,
  listings,
  categoryAttributes,
  categories,
} from '../../../infrastructure/database/schema/index.js';

type CreateListingInput = z.infer<typeof createListingSchema>;
type ListingStatus = 'archived' | 'published' | 'reserved' | 'sold';

export class ListingsRepository {
  constructor(private readonly db: Database) {}

  findById(id: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, id),
    });
  }

  async isLeafCategory(id: string) {
    const row = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    if (!row) return null;
    const [child] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, id))
      .limit(1);
    return !child;
  }

  async create(sellerId: string, input: CreateListingInput) {
    return this.db.transaction(async (tx) => {
      const [listing] = await tx
        .insert(listings)
        .values({
          sellerId,
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          price: String(input.price),
          currency: input.currency,
          country: input.country,
          city: input.city,
          condition: input.condition,
          deliveryModes: input.deliveryModes,
          status: 'draft',
        })
        .returning();

      if (!listing) {
        throw new Error('Failed to create listing');
      }

      if (input.attributes.length > 0) {
        await tx.insert(listingAttributes).values(
          input.attributes.map((attr) => ({
            listingId: listing.id,
            attributeId: attr.attributeId,
            value: attr.value,
          })),
        );
      }

      return listing;
    });
  }

  async update(listingId: string, input: CreateListingInput) {
    return this.db.transaction(async (tx) => {
      const [listing] = await tx
        .update(listings)
        .set({
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          price: String(input.price),
          currency: input.currency,
          country: input.country,
          city: input.city,
          condition: input.condition,
          deliveryModes: input.deliveryModes,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId))
        .returning();

      if (!listing) {
        return null;
      }

      await tx.delete(listingAttributes).where(eq(listingAttributes.listingId, listingId));
      if (input.attributes.length > 0) {
        await tx.insert(listingAttributes).values(
          input.attributes.map((attr) => ({
            listingId,
            attributeId: attr.attributeId,
            value: attr.value,
          })),
        );
      }

      return listing;
    });
  }

  async publishIfReady(
    listingId: string,
    from: string[],
    targetStatus: 'published' | 'pending_moderation',
    ai?: {
      listingTrustScore: number;
      aiRiskLevel: string;
      aiAssessment: Record<string, unknown>;
      aiAssessedAt: Date;
    },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT 1 FROM listings WHERE id = ${listingId}::uuid FOR UPDATE`);
      const [row] = await tx.select().from(listings).where(eq(listings.id, listingId));
      if (!row || !from.includes(row.status)) return null;

      const images = await tx
        .select({ id: listingImages.id })
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId));
      if (images.length === 0) {
        throw new ValidationError('Add at least one image before publishing');
      }

      const defs = await tx
        .select()
        .from(categoryAttributes)
        .where(eq(categoryAttributes.categoryId, row.categoryId));
      const values = await tx
        .select({
          attributeId: listingAttributes.attributeId,
          value: listingAttributes.value,
        })
        .from(listingAttributes)
        .where(eq(listingAttributes.listingId, listingId));
      const filled = new Set(
        values.filter((item) => item.value.trim().length > 0).map((item) => item.attributeId),
      );
      const missing = defs.filter((def) => def.required && !filled.has(def.id));
      if (missing.length > 0) {
        throw new ValidationError(
          `Missing required attributes: ${missing.map((item) => item.labelRu).join(', ')}`,
        );
      }

      const [listing] = await tx
        .update(listings)
        .set({
          status: targetStatus,
          publishedAt: targetStatus === 'published' ? new Date() : null,
          moderationNote: null,
          updatedAt: new Date(),
          listingTrustScore: ai?.listingTrustScore,
          aiRiskLevel: ai?.aiRiskLevel,
          aiAssessment: ai?.aiAssessment,
          aiAssessedAt: ai?.aiAssessedAt,
        })
        .where(and(eq(listings.id, listingId), inArray(listings.status, from)))
        .returning();
      return listing ?? null;
    });
  }

  async addImage(listingId: string, url: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT 1 FROM listings WHERE id = ${listingId}::uuid FOR UPDATE`);
      const images = await tx
        .select({ id: listingImages.id })
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId));
      if (images.length >= MAX_LISTING_IMAGES) return null;
      const [image] = await tx
        .insert(listingImages)
        .values({ listingId, url, sortOrder: images.length })
        .returning();
      return image ?? null;
    });
  }

  async setStatusIf(listingId: string, from: string[], to: ListingStatus) {
    const extra = to === 'published' ? { publishedAt: new Date() } : {};
    const [listing] = await this.db
      .update(listings)
      .set({
        status: to,
        updatedAt: new Date(),
        ...extra,
      })
      .where(and(eq(listings.id, listingId), inArray(listings.status, from)))
      .returning();
    return listing ?? null;
  }

  listImages(listingId: string) {
    return this.db.query.listingImages.findMany({
      where: eq(listingImages.listingId, listingId),
      orderBy: (table, { asc }) => [asc(table.sortOrder)],
    });
  }

  listAttributeValues(listingId: string) {
    return this.db
      .select({
        attributeId: listingAttributes.attributeId,
        value: listingAttributes.value,
      })
      .from(listingAttributes)
      .where(eq(listingAttributes.listingId, listingId));
  }

  listCategoryAttributes(categoryId: string) {
    return this.db.query.categoryAttributes.findMany({
      where: eq(categoryAttributes.categoryId, categoryId),
    });
  }

  async removeImage(listingId: string, imageId: string) {
    const [row] = await this.db
      .delete(listingImages)
      .where(and(eq(listingImages.id, imageId), eq(listingImages.listingId, listingId)))
      .returning();
    return row ?? null;
  }
}
