# Search history (Купилко)

Date: 2026-08-25  
Status: approved — implementing  
Slice: recent catalog text queries in TopBar and catalog search

## Goal

User sees and reuses recent search phrases without retyping. Works for guests and logged-in users.

## Out of scope

- Saved filters (country, category, price)
- Cross-device sync for guests
- Merge guest history into account on login
- Search suggestions / autocomplete from listings

## Data

### Logged in

Table `search_history`: `id`, `user_id`, `query` (trimmed, max 200), `created_at`.

- Max **10** rows per user (`MAX_SEARCH_HISTORY` in shared).
- Recording the same phrase again moves it to the top (delete old row, insert new).
- Trim + min length 2.

### Guest

Zustand persist `kupilko-search-history`, same cap and normalization, client UUID ids.

## API

Prefix `/v1/search/history`, auth required.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/` | — | `{ items: [{ id, query, createdAt }] }` |
| POST | `/` | `{ query }` | `{ item }` |
| DELETE | `/:id` | — | 204 |
| DELETE | `/` | — | 204 (clear all) |

Empty or too-short query on POST → 422.

## UI

- **TopBar** search: on submit → navigate to `/catalog?q=` and record query.
- **Catalog** search field: on blur / Enter with non-empty `q` → record.
- Focus on search input shows dropdown: recent queries, click → navigate; remove one; clear all.
- Dropdown uses card tokens, `z-50`, no full-page overlay.

## Tests

- Service: normalize, dedupe, cap at 10.
- Guest store unit test optional; API service test required.

## Success

- Submit «iphone 13» twice → one row, newest first.
- Guest history survives refresh; logged-in history survives re-login.
- Empty query never recorded.
