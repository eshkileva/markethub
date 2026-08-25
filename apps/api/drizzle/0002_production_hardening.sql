DELETE FROM "listing_attributes" AS la
WHERE NOT EXISTS (
  SELECT 1 FROM "category_attributes" AS ca WHERE ca."id" = la."attribute_id"
);
--> statement-breakpoint
ALTER TABLE "listing_attributes"
  ADD CONSTRAINT "listing_attributes_attribute_id_category_attributes_id_fk"
  FOREIGN KEY ("attribute_id") REFERENCES "public"."category_attributes"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "category_attributes_category_key_uidx"
  ON "category_attributes" USING btree ("category_id","key");
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "buyer_id" uuid;
--> statement-breakpoint
UPDATE "conversations" AS c
SET "buyer_id" = p."user_id"
FROM "conversation_participants" AS p, "listings" AS l
WHERE p."conversation_id" = c."id"
  AND l."id" = c."listing_id"
  AND p."user_id" <> l."seller_id";
--> statement-breakpoint
DELETE FROM "conversations" WHERE "buyer_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "buyer_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_buyer_id_users_id_fk"
  FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_listing_buyer_uidx" ON "conversations" USING btree ("listing_id","buyer_id");
--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_status_chk"
  CHECK ("status" IN ('draft', 'pending_moderation', 'published', 'reserved', 'sold', 'archived', 'rejected'));
--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_condition_chk"
  CHECK ("condition" IN ('new', 'used', 'for_parts'));
--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_currency_chk"
  CHECK ("currency" IN ('BYN', 'RUB', 'KZT'));
--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_country_chk"
  CHECK ("country" IN ('BY', 'RU', 'KZ'));
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_country_chk"
  CHECK ("country" IN ('BY', 'RU', 'KZ'));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_status_country_published_idx"
  ON "listings" USING btree ("status","country","published_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_attributes_attribute_value_idx"
  ON "listing_attributes" USING btree ("attribute_id","value");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_title_trgm_idx"
  ON "listings" USING gin ("title" gin_trgm_ops);
