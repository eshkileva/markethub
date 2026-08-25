# Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Postgres so listings and chats cannot corrupt, serve brand/model pickers only from the database, and put the existing theme switch in the header.

**Architecture:** One Drizzle migration for FKs, CHECKs, unique chat pair, and indexes. Listing status and photo limits use `SELECT … FOR UPDATE` plus `UPDATE … WHERE status IN`. Catalog HTTP drops MobileAPI/Apify. CLI `catalogs:sync phones` fills models with backoff. TopBar reuses `useUiStore.theme`.

**Tech Stack:** Postgres 16, Drizzle, Fastify, Vitest, React, Zustand.

## Global Constraints

- Do not add category-tree UI, search history, cities table, or delivery-modes table.
- Catalog GET must not call MobileAPI or Apify.
- Wrong listing status transition returns 409 (`ConflictError`), Russian message.
- Do not commit unless the user asks.
- Verify with `pnpm --filter @markethub/api test` and `pnpm db:migrate`.

---

### Task 1: Schema + migration

**Files:**
- Modify: `apps/api/src/infrastructure/database/schema/categories.ts`
- Modify: `apps/api/src/infrastructure/database/schema/listings.ts`
- Modify: `apps/api/src/infrastructure/database/schema/messaging.ts`
- Modify: `apps/api/src/infrastructure/database/schema/users.ts`
- Create: `apps/api/drizzle/0002_production_hardening.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`

- [ ] Add FKs, unique `(category_id, key)`, unique `(listing_id, buyer_id)`, CHECK constraints, feed/EAV/trgm indexes in schema + SQL. Backfill `conversations.buyer_id`. Delete orphan `listing_attributes` before FK.

### Task 2: Atomic listing writes + 409

**Files:**
- Modify: `apps/api/src/modules/listings/infrastructure/listings.repository.ts`
- Modify: `apps/api/src/modules/listings/application/listings.service.ts`
- Create: `apps/api/src/modules/listings/application/listings.service.test.ts`

- [ ] `setStatusIf(id, from[], to)` with `WHERE status IN`. `publishIfReady` and `addImage` lock the listing row. Service maps null update to `ConflictError`. Tests for published→reserved vs draft→reserved.

### Task 3: Conversations buyer_id

**Files:**
- Modify: `apps/api/src/modules/messaging/infrastructure/messaging.repository.ts`

- [ ] Insert `buyerId` on create. `findBetween` uses `(listingId, buyerId)`. On unique violation, return the existing row.

### Task 4: Catalog GET from Postgres only

**Files:**
- Modify: `apps/api/src/modules/catalogs/application/catalogs.service.ts`
- Modify: `apps/api/src/modules/catalogs/sync.ts`
- Modify: `apps/api/src/modules/catalogs/infrastructure/catalogs.repository.ts` (if list brand id+name needed)
- Create: `apps/api/src/modules/catalogs/application/catalogs.service.test.ts`

- [ ] Remove `ensurePhone*` from `listBrands`/`listModels`. CLI `phones` syncs brands then models per brand, skip if models exist, stop on 429. Tests: fake MobileAPI throws if HTTP path calls it.

### Task 5: Theme in TopBar

**Files:**
- Create: `apps/web/src/widgets/top-bar/ui/ThemeSwitch.tsx`
- Modify: `apps/web/src/widgets/top-bar/ui/TopBar.tsx`

- [ ] Segment Система / Светлая / Тёмная (icons on mobile, labels `sm+`). Keep Settings `ThemeCard`.

### Task 6: Apply migration and verify

- [ ] `pnpm db:migrate`
- [ ] `pnpm --filter @markethub/api test`
- [ ] `pnpm --filter @markethub/web typecheck` if TopBar types need it
