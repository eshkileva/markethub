# Category tree, Avito-lite (Купилко)

Date: 2026-08-25  
Status: approved — implementing  
Slice: two-level taxonomy (root → leaf), new roots kids/animals/services, no «Работа»

## Goal

Sellers pick a leaf, not a baggy root. Buyers filter a root (all children) or one leaf. Attributes live on the leaf. Existing `kind` enums that duplicated the tree become real categories.

## Out of scope

- «Работа» / резюме / вакансии
- «Готовый бизнес»
- Separate listing type for services (salary, no photos). Services stay ordinary listings in this slice; `condition` stays required in the API. Hide «Состояние» in the create form for service leaves in a later slice if it feels stupid.
- Admin UI to edit the tree
- Third nesting level
- Inherited attribute schema from parent (copy defs onto each leaf; no runtime inherit)
- Search history

## Shape

Exactly two levels. `categories.parent_id` is already in the schema. Roots have `parent_id = null`. Leaves point at a root. Listings attach **to a leaf**. Creating on a root → 422 «Выберите подкатегорию».

`GET /v1/categories` returns the flat list plus `parentId` (null for roots). Web groups by parent. No new endpoint required unless grouping on the client is ugly — then `GET /v1/categories?tree=1` with `{ items: [{ …, children: […] }] }` is allowed.

`GET /v1/listings?categoryId=` on a **root** means that root’s leaves (`IN (…child ids)`). On a **leaf** — exact match as today.

## Tree

Keep the current nine roots. Add three. Slugs are stable; Russian names are UI.

### Электроника `electronics`

ТВ и видео `tv-video` · Аудио `audio` · Игровые приставки `consoles` · Фото `photo`

Телефоны и компьютеры **не** входят — они соседние корни.

### Компьютеры `computers`

Ноутбуки `laptops` · ПК `desktops` · Комплектующие `pc-parts`

Мониторы остаются в электронике (`tv-video` / отдельно не плодим).

### Телефоны `phones`

Смартфоны `smartphones` · Планшеты `tablets` · Аксессуары `phone-accessories`

Наушники — `electronics/audio`, не аксессуары телефона.

### Бытовая техника `appliances`

Крупная `large-appliances` · Мелкая `small-appliances`

### Авто `auto`

Легковые `cars` · Мото `moto` · Запчасти `auto-parts` · Шины и диски `tires`

### Недвижимость `realty`

Квартира `apartments` · Дом `houses` · Комната `rooms` · Участок `land`

### Хобби и отдых `hobby`

Вело `bikes` · Спорт `sport` · Музыка `music` · Туризм `tourism`

### Одежда и обувь `fashion`

Одежда `clothes` · Обувь `shoes` · Аксессуары `fashion-accessories` · Косметика `cosmetics`

Детская одежда — не сюда, а в `kids`.

### Дом и сад `home-garden`

Мебель `furniture` · Декор `decor` · Ремонт `repair` · Сад `garden`

### Детские товары `kids` (новый корень)

Одежда `kids-clothes` · Игрушки `toys` · Коляски и автокресла `strollers` · Детская мебель `kids-furniture`

### Животные `animals` (новый корень)

Собаки `dogs` · Кошки `cats` · Другие животные `other-pets` · Товары для животных `pet-supplies`

### Услуги `services` (новый корень)

Ремонт техники `service-repair` · Мастер на час `handyman` · Уборка `cleaning` · Красота `service-beauty` · Переезды `moving`

## Attributes

Move defs from root slug to **leaves**. Drop `kind` where the leaf is that kind.

| Leaf | Attributes |
|---|---|
| `smartphones`, `tablets` | phone dictionary brand + model; smartphones also storage, color |
| `phone-accessories` | none required |
| `laptops`, `desktops` | computer dictionary manufacturer + model, memory, chipset, storage |
| `pc-parts` | computer dictionary manufacturer + model |
| `cars`, `moto` | auto dictionary brand + model, year, mileage; cars also fuel |
| `auto-parts`, `tires` | none required in this slice |
| `apartments`, `houses`, `rooms` | rooms (apartments/rooms), area |
| `land` | area |
| `clothes`, `shoes` | size, gender, season |
| `kids-clothes` | size, season (без «Для кого» — это и так детское) |
| `tv-video`, `audio`, `consoles`, `photo` | brand enum as today on electronics, without `kind` |
| `large-appliances`, `small-appliances` | brand enum as today on appliances, without `kind` |
| `furniture`, `decor`, `repair`, `garden` | material optional; without `kind` |
| `bikes`, `sport`, `music`, `tourism` | none; without `kind` |
| service / animal / kids other leaves | none in this slice |

Dictionaries stay: auto → cars/moto, phone → smartphones/tablets, computer → laptops/desktops/pc-parts.

## Seed and demo remap

`seed.ts` upserts roots (already exist) and inserts leaves with `parent_id`. Category seed today bails if any row exists — change to **idempotent upsert by slug** so existing DBs get children.

Demo listings:

- `iphone13` → `smartphones`
- `macbook` → `laptops`
- `washer` → `large-appliances`
- `bike` → `bikes`
- `jacket` → `clothes`
- `sofa` → `furniture`
- `monitor` → `tv-video`
- `headphones` → `audio`
- `ps5` → `consoles`
- `coffee` → `small-appliances`

Existing user listings (if any): map by current `category.slug` + attribute `kind` value; if no kind, first leaf of that root. Then delete obsolete `kind` attributes from those categories.

## UI

- Catalog filter: Combobox of roots + «Все», then if a root is selected a second Combobox of its leaves + «Все в категории». URL: `category` = slug (root or leaf). Root slug in the query still means «all children» on the API via expanded ids.
- Create listing: two Comboboxes, country-style. Attributes load for the **leaf**.
- Sidebar/home category chips: roots only (current nine plus three new).

## Errors

- Create/update with a root `categoryId` → 422, copy: «Выберите подкатегорию».
- Unknown slug → empty catalog as today.

## Tests

- Listings query: `categoryId` of `phones` returns a listing on `smartphones`.
- Create listing on `phones` (root) → 422.
- Categories response includes `parentId`; each new root has the children listed above.
- Seed is idempotent: second `db:seed` does not duplicate slugs.

## Success

- Catalog can open «Авто» and see cars + moto + parts; open «Легковые» and see only cars.
- Create listing cannot save on «Электроника» without a leaf.
- Dark-theme Combobox, no native OS select.

## Follow-up

Optional «Состояние» for service leaves; larger animal/realty commercial leaves; Работа as its own product.
