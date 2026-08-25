# Купилко Design System

C2C marketplace for CIS (BY / RU / KZ). Warm paper canvas, plum navigation, orange sell CTA — not a generic SaaS dashboard.

## Tokens

| Role          | Value     | Usage                         |
| ------------- | --------- | ----------------------------- |
| Primary       | `#6D28D9` | Nav active, links, brand mark |
| Primary hover | `#5B21B6` | Primary buttons               |
| Accent        | `#EA580C` | «Разместить», conversion CTA  |
| Accent hover  | `#C2410C` | Accent buttons                |
| Canvas        | `#F4EFE6` | App background (warm paper)   |
| Surface       | `#FFFDF8` | Cards                         |
| Sidebar       | `#1C0B33` | Plum navigation               |
| Sidebar muted | `#C4B5D6` | Inactive nav                  |
| Text          | `#1A1225` | Headings and body             |
| Muted         | `#5C5268` | Meta (city, time)             |
| Border        | `#E4D8C8` | Warm hairline                 |
| Success       | `#15803D` | Active, sold                  |
| Warning       | `#C2410C` | Pending                       |
| Danger        | `#BE123C` | Errors                        |

## Typography

- Display / wordmark: **Unbounded** (500/600/700)
- UI: **Manrope** (400/500/600/700)
- Feature numbers / prices: tabular lining
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 40

## Layout

- Persistent plum sidebar + cream canvas + ivory cards
- Brand mark: rotated «К» in a rounded square
- Max content width inside the app shell
- Product grid: 1 / 2 / 3 / 4 columns
- Cards: `rounded-[1.25rem]`, `shadow-sm`, hover `shadow-md` (no layout-shifting scale)
- Buttons: pill (`rounded-full`); sell CTA uses accent orange
- Status: tinted pills, never color-only

## Motion

- 180–240ms color/shadow transitions
- Respect `prefers-reduced-motion`
- No emoji as icons — Lucide only

## Trust / CIS

- Country + currency always visible in chrome
- Listing price shows source currency and converted amounts (BYN / RUB / KZT)
- Cities come from `/v1/geo/cities` and follow the selected country
