# Category tree Avito-lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Do **not** commit unless the user asks. TDD for API helpers and create-on-root 422.

**Goal:** Two-level category tree (12 roots, leaves only for listings); catalog root filter includes children; create rejects roots.

**Architecture:** Seed upserts the tree by slug. `listingCategoryIds()` expands a root to `[root, ...leaves]`. `ListingsService.createDraft/update` rejects categories that have children. Web shows roots in sidebar/home; catalog and create use two Comboboxes.

**Tech Stack:** Fastify, Drizzle, Vitest, React Query, existing Combobox.

## Global Constraints

- Copy for root create: `Выберите подкатегорию`
- No «Работа». Services stay ordinary listings; `condition` still required in API.
- Attributes copied onto leaves; no runtime inherit. Drop `kind`.
- Do not commit unless asked.

---

### Task 1: Expand category ids + reject root on create

**Files:**
- Create: `apps/api/src/modules/categories/application/category-tree.ts`
- Create: `apps/api/src/modules/categories/application/category-tree.test.ts`
- Modify: `apps/api/src/modules/listings/application/listings.service.ts`
- Modify: `apps/api/src/modules/listings/application/listings.service.test.ts`
- Modify: `apps/api/src/modules/listings/infrastructure/listings.repository.ts`
- Modify: `apps/api/src/modules/listings/http/listings.query.ts`

**Interfaces:**
- `listingCategoryIds(rows: Array<{ id: string; parentId: string | null }>, categoryId: string): string[]`
- `ListingsRepository.isLeafCategory(id: string): Promise<boolean | null>` — `null` if missing, `false` if has children

- [ ] **Step 1:** Test `listingCategoryIds` — root returns root+children; leaf returns `[leaf]`.
- [ ] **Step 2:** Test `createDraft` on a root → `ValidationError` «Выберите подкатегорию».
- [ ] **Step 3:** Implement helper, `isLeafCategory`, gate in `createDraft`/`update`, `inArray` in `listCatalog`.

---

### Task 2: Taxonomy seed + attribute remap

**Files:**
- Create: `apps/api/src/infrastructure/database/category-tree.seed.ts` (roots, leaves, `CATEGORY_ATTRIBUTE_DEFS` by **leaf** slug)
- Modify: `apps/api/src/infrastructure/database/category-attributes.seed.ts` (re-export or move defs)
- Modify: `apps/api/src/infrastructure/database/seed.ts` — idempotent upsert by slug; remap listings; demo slugs from spec

Tree as in `docs/superpowers/specs/2026-08-25-category-tree-design.md`.

Kind→leaf fallback when remapping listings that still sit on a root:

- electronics: Монитор/ТВ → `tv-video`, Наушники/Колонка → `audio`, Приставка → `consoles`, else `tv-video`
- appliances: Кофемашина/Пылесос → `small-appliances`, else `large-appliances`
- hobby: Велосипед → `bikes`, Спорт → `sport`, Музыка → `music`, Туризм → `tourism`, else `bikes`
- home-garden: Мебель → `furniture`, Декор → `decor`, Инструмент → `repair`, Сад → `garden`, else `furniture`
- realty: Квартира → `apartments`, Дом → `houses`, Комната → `rooms`, Участок → `land`, else `apartments`
- phones → `smartphones`, computers → `laptops`, auto → `cars`, fashion → `clothes`

Re-point `listing_attributes` by attribute `key` onto the new leaf. Delete `kind` attrs (listing rows first — FK restrict).

Demo `category` fields: iphone13 `smartphones`, macbook `laptops`, washer `large-appliances`, bike `bikes`, jacket `clothes`, sofa `furniture`, monitor `tv-video`, headphones `audio`, ps5 `consoles`, coffee `small-appliances`.

- [ ] **Step 1:** Upsert tree + leaf attributes; remap; `pnpm db:seed` twice without duplicate slugs.

---

### Task 3: Web two-level pickers

**Files:**
- Modify: `apps/web/src/entities/category/model/icons.ts` — `kids` Baby, `animals` PawPrint, `services` HandHelping
- Modify: CatalogPage, CreateListingPage, AppSidebar, HomePage
- Modify: `apps/web/e2e/catalog-favorites.spec.ts` — create on `laptops` not `computers`

- [ ] Catalog: Combobox roots + «Все»; if root selected, Combobox leaves + «Все в категории». `search.category` is root or leaf slug. Attr filters only when slug is a leaf.
- [ ] Create: root Combobox then leaf Combobox; default leaf `laptops`; attributes from leaf.
- [ ] Sidebar/home: `parentId == null` only.

---

### Task 4: Verify

- [ ] `pnpm --filter @markethub/api test`
- [ ] `pnpm --filter @markethub/api typecheck` and web typecheck
- [ ] `pnpm db:seed`
- [ ] `GET /v1/categories` has `parentId`; `GET /v1/listings?categoryId=<phones-root>` includes smartphone demo
