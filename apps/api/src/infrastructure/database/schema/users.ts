import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phone: text('phone'),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    username: text('username').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    country: text('country').notNull(),
    city: text('city'),
    role: text('role').notNull().default('user'),
    trustScore: integer('trust_score').notNull().default(0),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_uidx').on(table.email),
    uniqueIndex('users_username_uidx').on(table.username),
    uniqueIndex('users_phone_uidx').on(table.phone),
    index('users_country_idx').on(table.country),
    check('users_country_chk', sql`${table.country} in ('BY', 'RU', 'KZ')`),
  ],
);
