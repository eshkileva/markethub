CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" text NOT NULL,
	"name_ru" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cities_country_name_uidx" ON "cities" USING btree ("country","name_ru");
--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country");
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_chk" CHECK ("country" IN ('BY', 'RU', 'KZ'));
