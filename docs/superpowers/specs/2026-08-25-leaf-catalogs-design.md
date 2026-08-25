# Leaf-scoped catalog dictionaries (Купилко)

Date: 2026-08-25  
Status: approved — implementing  
Slice: brand/model dictionaries keyed by subcategory leaf, not by auto/phone/computer

## Goal

`GET /v1/catalogs/:kind/brands` for `cars` does not return moto brands. Each leaf that has a Combobox dictionary reads only its own rows.

## Out of scope

- Dictionaries for electronics / appliances / auto-parts / tires / accessories (keep enum or no picker)
- Admin editor, MobileAPI/Apify import
- Sharing one brand row across leaves (Honda cars ≠ Honda moto)

## Shape

Reuse `catalog_brands.kind`. Allowed values = leaf slugs:

`cars` · `moto` · `smartphones` · `tablets` · `laptops` · `desktops` · `pc-parts`

`category_attributes.dictionary` on those leaves matches the slug. `CATALOG_KINDS` in `@markethub/shared` is that list. `isCatalogKind` / Combobox `/v1/catalogs/${kind}/brands` stay as they are.

CHECK on `catalog_brands.kind` after data remap.

## Data

| Leaf | Source |
|---|---|
| `cars` | existing `docs/cars.json` (rename kind `auto` → `cars`) |
| `moto` | owned in-repo list (Honda, Yamaha, Kawasaki, …) — not a copy of cars.json |
| `smartphones` | `docs/phones.json` (`phone` → `smartphones`) |
| `tablets` | owned `docs/tablets.json` starter (iPad, Tab, Pad) |
| `laptops` / `desktops` / `pc-parts` | split the current computer fallback; delete mixed `computer` rows and reseed |

Listing attribute values stay strings (brand name). No FK rewrite.

## Seed / migrate

1. `UPDATE catalog_brands SET kind = 'cars' WHERE kind = 'auto'`
2. `… smartphones WHERE kind = 'phone'`
3. Delete `kind = 'computer'` (models cascade)
4. Seed empty kinds from files/lists
5. Attribute seed writes `dictionary: 'cars'` etc. (existing updater already overwrites the column)

CLI: `catalogs:sync cars|moto|phones|tablets|computers`.

## Tests

- `parseKind('cars')` ok; `parseKind('auto')` 422
- `listBrands('moto')` calls repo with `'moto'`, not `'cars'`
- Existing GET still does not scrape Apify

## Success

Create listing: Легковые → Toyota; Мото → Yamaha, no Camry. Планшеты → iPad, not iPhone 16. Комплектующие → RTX, not MacBook Air.
