UPDATE "catalog_brands" SET "kind" = 'cars' WHERE "kind" = 'auto';
--> statement-breakpoint
UPDATE "catalog_brands" SET "kind" = 'smartphones' WHERE "kind" = 'phone';
--> statement-breakpoint
DELETE FROM "catalog_brands" WHERE "kind" = 'computer';
--> statement-breakpoint
ALTER TABLE "catalog_brands" ADD CONSTRAINT "catalog_brands_kind_chk" CHECK ("kind" IN ('cars', 'moto', 'smartphones', 'tablets', 'laptops', 'desktops', 'pc-parts'));
