import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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
  (table) => [index('categories_parent_idx').on(table.parentId)],
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
  },
  (table) => [index('category_attributes_category_idx').on(table.categoryId)],
);
