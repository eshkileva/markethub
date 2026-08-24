import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { categories } from './categories.js';
import { users } from './users.js';

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull(),
    country: text('country').notNull(),
    city: text('city').notNull(),
    condition: text('condition').notNull(),
    deliveryModes: jsonb('delivery_modes').$type<string[]>().notNull(),
    status: text('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('listings_seller_idx').on(table.sellerId),
    index('listings_category_idx').on(table.categoryId),
    index('listings_country_status_idx').on(table.country, table.status),
    index('listings_published_idx').on(table.publishedAt),
  ],
);

export const listingAttributes = pgTable(
  'listing_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    attributeId: uuid('attribute_id').notNull(),
    value: text('value').notNull(),
  },
  (table) => [
    index('listing_attributes_listing_idx').on(table.listingId),
    uniqueIndex('listing_attributes_unique').on(table.listingId, table.attributeId),
  ],
);

export const listingImages = pgTable(
  'listing_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('listing_images_listing_idx').on(table.listingId)],
);

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('favorites_user_listing_uidx').on(table.userId, table.listingId)],
);
