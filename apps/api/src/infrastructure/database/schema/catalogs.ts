import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const catalogBrands = pgTable(
  'catalog_brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').notNull(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    nameRu: text('name_ru'),
    popular: integer('popular').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('catalog_brands_kind_key_uidx').on(table.kind, table.key),
    index('catalog_brands_kind_idx').on(table.kind),
  ],
);

export const catalogModels = pgTable(
  'catalog_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => catalogBrands.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    nameRu: text('name_ru'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('catalog_models_brand_key_uidx').on(table.brandId, table.key),
    index('catalog_models_brand_idx').on(table.brandId),
  ],
);
