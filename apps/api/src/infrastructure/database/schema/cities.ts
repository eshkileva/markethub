import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    country: text('country').notNull(),
    nameRu: text('name_ru').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('cities_country_name_uidx').on(table.country, table.nameRu),
    index('cities_country_idx').on(table.country),
  ],
);
