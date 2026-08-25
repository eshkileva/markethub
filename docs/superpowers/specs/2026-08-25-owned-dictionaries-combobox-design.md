# Owned dictionaries and combobox (Купилко)

Date: 2026-08-25  
Status: draft — wait for user review before implementation plan  
Slice: cities and catalogs from our files/Postgres only; one Combobox instead of native select and SearchSelect

## Goal

Reading cities, brands, and models never depends on GeoHelper, MobileAPI, or Apify. Pickers use our surface tokens in light and dark theme and do not flicker or steal clicks while a request is in flight.

## Out of scope

- Category tree and per-leaf filters
- Search history
- One-shot import from GeoNames / GeoHelper / MobileAPI
- Admin UI to edit dictionaries
- Changing FX source (CurrencyAPI stays for rates, not for geography)

## Current pain

- `GET /v1/geo/cities` may call GeoHelper; Redis miss + API fail → short static fallback.
- `SearchSelect` on focus sends `q=""`, shows «Загрузка…», and the previous options disappear — clicks miss. Debounced refetch races with typing.
- Header country/currency are native `<select>`. Windows paints the dropdown with the OS theme, not `.dark`.

## Data

### Cities

- Table `cities`: `id`, `country` (BY|RU|KZ), `name_ru`, unique `(country, name_ru)`, index `(country)`.
- Seed from an owned file (the existing CIS list in `packages/shared/src/geo/cities.ts`, moved/copied to `apps/api` seed data). No GeoHelper on seed or on GET.
- `GET /v1/geo/cities?country=` returns that country’s rows (cap 500). `q` optional for ILIKE but the web form will not send `q` — it loads once per country.
- `assertCity` checks `cities` only.

### Catalogs

- Cars: keep `docs/cars.json` → `catalog_brands` / `catalog_models` (already owned).
- Phones / computers: runtime GET already reads Postgres. CLI `catalogs:sync phones` must not call MobileAPI. If phone rows are missing, seed from a small owned `docs/phones.json` (starter brands/models we maintain). Computers stay the in-repo fallback list; do not call Apify unless someone later sets the scrape flag (out of this slice to remove the flag — just do not invoke it from seed/dev GET).
- Remove GeoHelper from `GeoService.listCities` / cache path used by the form.

## Combobox

Replace `SearchSelect` and header/filter native selects with one `Combobox`:

- Input + list in `bg-card` / `text-foreground` / `border-border`, `z-50`, `max-h-64` scroll.
- Options passed in (already fetched). Filter locally by label, case-insensitive `ru-RU`.
- No `onQuery` network. No loading row that replaces the list after open.
- `onMouseDown preventDefault` on options stays so blur does not close before click.
- Keyboard: ArrowUp/Down, Enter, Escape.
- Country and currency in `TopBar`: same Combobox, short static options (`СНГ` + BY/RU/KZ, BYN/RUB/KZT).
- Catalog filters (`NativeSelect` for category, sort, condition, delivery, currency) use Combobox with the known option lists.
- `CitySelect` / `CatalogBrandField` / `CatalogModelField`: one query per country or per kind/brand (brands/models still from `/v1/catalogs/...` without `q`, or with empty q), then local filter. Keep brand→model: changing brand clears model and fetches that brand’s models once.
- Delete `SearchSelect` when unused.

## Errors

- Unknown city on create listing → 422 as today, copy unchanged.
- Empty dictionary → empty list and existing emptyLabel, not a 502.

## Tests

- `GeoService.listCities` / `assertCity` do not call HTTP (fake redis + db or unit on repository).
- Combobox filter: type «мин» matches Минск (component test if cheap; otherwise skip and rely on typecheck).
- Catalog GET still does not call MobileAPI (existing test).

## Success

- Dark theme: country/currency/city/brand lists match the card surface.
- Opening a city field does not flash «Загрузка…» on every keypress.
- Site works with GeoHelper/MobileAPI keys unset, if seed ran.

## Follow-up

Category tree, larger city dumps, optional one-time import scripts.
