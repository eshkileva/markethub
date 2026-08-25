# Production hardening (Купилко)

Date: 2026-08-25  
Status: approved — implementing 2026-08-25 slice  
Slice: database integrity + catalog dictionaries from Postgres + theme in the header

## Goal

Ship a marketplace that does not corrupt itself under races or bad input, and whose brand/model pickers work without calling third-party APIs on each form request. Not textbook 3NF. Subcategories, search history, and extra per-leaf filters are the next slice, not this one.

## Out of scope

- Category tree UI and inherited filters
- Search history
- Cities table / moving FX rates into Postgres
- `listing_delivery_modes` table (keep jsonb)
- Live PCPartPicker scrape (actor still broken); keep the built-in computer dictionary
- Free-text brand/model when missing from the dictionary
- Background MobileAPI fill on empty model list
- Production deploy/backups playbook (compose.prod already exists)

## Current facts

- Theme already exists in Settings (`light` / `dark` / `system`) and persists in `kupilko-ui`.
- `GET /v1/catalogs/phone/models` can call MobileAPI when the brand has no rows — 429 empties the picker.
- `GET /v1/catalogs/phone/brands` can trigger a brand sync if the table is empty.
- Listing status changes are read-then-write without `WHERE status IN (…)`.
- `listing_attributes.attribute_id` has no FK. `categories.parent_id` has no self-FK.

## Database

Keep jsonb `delivery_modes` and denormalized `users.trust_score`. Add constraints and indexes so the app cannot write garbage and common queries stay cheap.

### Integrity

- FK `listing_attributes.attribute_id` → `category_attributes.id` (`on delete restrict`).
- Self-FK `categories.parent_id` → `categories.id` (`on delete restrict`).
- Unique `(category_id, key)` on `category_attributes`.
- Unique `(listing_id, buyer_id)` for chats: add `conversations.buyer_id` (the non-seller participant) with FK to `users`, unique `(listing_id, buyer_id)`. Backfill from `conversation_participants` where `user_id <> listings.seller_id`. Create path writes `buyer_id` in the same transaction as participants.
- CHECK: `listings.status` in `draft | pending_moderation | published | reserved | sold | archived | rejected`; `listings.condition` in `new | used | for_parts`; `listings.currency` and `listings.country` against the existing CIS sets; same country check on `users.country`.

### Atomic writes

- `publish` / `reserve` / `sell` / `relist` / `archive`: one `UPDATE … SET status = $to WHERE id = $id AND status IN ($from) RETURNING *`. Zero rows → 409, not a silent success.
- `publish` also runs inside a transaction: `SELECT … FOR UPDATE` the listing, verify ≥1 image and required attributes, then the status update.
- `addImage`: same listing lock, count images, insert only if under `MAX_LISTING_IMAGES`.

### Indexes

- `listings (status, country, published_at desc)` for the catalog feed.
- `listing_attributes (attribute_id, value)` for `attr=` filters.
- Enable `pg_trgm` and GIN on `listings.title` (and `description` if cheap enough; title first if two indexes are too heavy). Catalog search `q` uses `ILIKE` today.

Migration: new Drizzle SQL under `apps/api/drizzle/`. Existing demo data must still apply. Empty `parent_id` stays null.

## Catalog dictionaries

HTTP must not call MobileAPI or Apify.

- `listBrands` / `listModels` only read Postgres. Empty list → `200 { items: [] }`.
- `pnpm catalogs:sync phones` syncs brands, then models per brand with delay; skip brands that already have models; on 429 stop and keep stored rows (re-run later).
- `pnpm catalogs:sync computers` keeps the static fallback unless `APIFY_COMPUTER_SCRAPE=1`.
- Cars stay file-seeded; do not re-download on GET.
- UI: keep `SearchSelect` debounce; limits 80 brands / 120 models. No custom values in this slice.

Usability after this slice: autos are already good; phones become good only after a successful CLI model sync (expect rate limits — partial DB is OK); computers stay a short fallback list.

## Theme

- Segmented control in `TopBar` next to country/currency: Система / Светлая / Тёмная.
- Same `useUiStore.theme` + `applyTheme` as Settings. Keep Settings `ThemeCard`.
- `aria-label` on the group. Compact on mobile so the search field still fits (abbreviate to icons with visible text on `sm+` if the row overflows).

## Errors

- Wrong listing transition → 409 with a Russian message.
- Catalog GET never 502 because a third party failed.
- Migration failure stops deploy (`db:migrate` before API serve — already the local habit; keep it).

## Tests

- Status update: published→reserved succeeds; draft→reserved returns nothing / 409.
- `listModels` / `listBrands` do not call MobileAPI (unit with a fake client that throws if invoked).
- Optional: unique `(listing_id, buyer_id)` rejects a second conversation.

## Success

- Cannot insert a listing attribute with a random UUID.
- Two parallel “reserve” calls: one wins.
- Form brand/model works offline from third parties if the DB is seeded.
- Theme is switchable from the header without opening Settings.

## Follow-up (not this slice)

Category tree + per-leaf filters, search history, GeoHelper-backed `cities`, real computer scrape when the actor works, outbox for domain events.
