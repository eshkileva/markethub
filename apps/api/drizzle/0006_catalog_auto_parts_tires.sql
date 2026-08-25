ALTER TABLE "catalog_brands" DROP CONSTRAINT IF EXISTS "catalog_brands_kind_chk";

ALTER TABLE "catalog_brands" ADD CONSTRAINT "catalog_brands_kind_chk" CHECK (
  "kind" IN (
    'cars',
    'moto',
    'smartphones',
    'tablets',
    'laptops',
    'desktops',
    'pc-parts',
    'auto-parts',
    'tires'
  )
);
