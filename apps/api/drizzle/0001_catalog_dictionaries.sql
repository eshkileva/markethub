CREATE TABLE "catalog_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"popular" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_attributes" ADD COLUMN "dictionary" text;
--> statement-breakpoint
ALTER TABLE "category_attributes" ADD COLUMN "parent_key" text;
--> statement-breakpoint
ALTER TABLE "catalog_models" ADD CONSTRAINT "catalog_models_brand_id_catalog_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."catalog_brands"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_brands_kind_key_uidx" ON "catalog_brands" USING btree ("kind","key");
--> statement-breakpoint
CREATE INDEX "catalog_brands_kind_idx" ON "catalog_brands" USING btree ("kind");
--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_models_brand_key_uidx" ON "catalog_models" USING btree ("brand_id","key");
--> statement-breakpoint
CREATE INDEX "catalog_models_brand_idx" ON "catalog_models" USING btree ("brand_id");
