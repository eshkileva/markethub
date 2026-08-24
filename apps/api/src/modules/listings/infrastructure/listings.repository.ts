import { and, eq } from 'drizzle-orm';
import type { createListingSchema } from '@markethub/shared';
import type { z } from 'zod';
import type { Database } from '../../../infrastructure/database/client.js';
import {
  listingAttributes,
  listingImages,
  listings,
  categoryAttributes,
} from '../../../infrastructure/database/schema/index.js';

type CreateListingInput = z.infer<typeof createListingSchema>;

export class ListingsRepository {
  constructor(private readonly db: Database) {}

  findById(id: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, id),
    });
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

  async publish(listingId: string) {
    const [listing] = await this.db
      .update(listings)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(listings.id, listingId)))
      .returning();
    return listing ?? null;
  }

  async addImage(listingId: string, url: string, sortOrder: number) {
    const [image] = await this.db
      .insert(listingImages)
      .values({ listingId, url, sortOrder })
      .returning();
    return image!;
  }

  async setStatus(listingId: string, status: 'archived' | 'published' | 'reserved' | 'sold') {
    const [listing] = await this.db
      .update(listings)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId))
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
