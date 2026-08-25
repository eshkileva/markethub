import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    nameRu: text('name_ru').notNull(),
    parentId: uuid('parent_id'),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('categories_parent_idx').on(table.parentId),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'categories_parent_id_fk',
    }).onDelete('restrict'),
  ],
);

export const categoryAttributes = pgTable(
  'category_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    labelRu: text('label_ru').notNull(),
    type: text('type').notNull(),
    options: jsonb('options').$type<string[]>(),
    required: boolean('required').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    dictionary: text('dictionary'),
    parentKey: text('parent_key'),
  },
  (table) => [
    index('category_attributes_category_idx').on(table.categoryId),
    uniqueIndex('category_attributes_category_key_uidx').on(table.categoryId, table.key),
  ],
);
