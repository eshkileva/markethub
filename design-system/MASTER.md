# MarketHub Design System

Premium C2C marketplace for CIS (BY / RU / KZ). Dashboard-style product, not a marketing landing page.

## Tokens

| Role          | Value     | Usage                                     |
| ------------- | --------- | ----------------------------------------- |
| Primary       | `#7C3AED` | CTA, active nav, links, user chat bubbles |
| Primary hover | `#6D28D9` | Buttons                                   |
| Secondary     | `#A78BFA` | Soft highlights                           |
| Success       | `#16A34A` | Active, sold, online                      |
| Warning       | `#EA580C` | Pending moderation                        |
| Info          | `#2563EB` | Delivery, info chips                      |
| Danger        | `#DC2626` | Removed, errors                           |
| Canvas        | `#F9FAFB` | Main background                           |
| Surface       | `#FFFFFF` | Cards, top bar                            |
| Sidebar       | `#0B1220` | Dark navy navigation                      |
| Sidebar muted | `#94A3B8` | Inactive nav                              |
| Text          | `#0F172A` | Headings and body                         |
| Muted         | `#475569` | Meta (city, time)                         |
| Border        | `#E5E7EB` | Hairline borders                          |

## Typography

- UI: **Inter** (400/500/600/700)
- Feature numbers / prices: tabular lining
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 40

## Layout

- Persistent dark sidebar + white top bar + gray canvas
- Max content width inside the app shell, not a centered marketing column
- Product grid: 1 / 2 / 3 / 4 columns
- Cards: `rounded-2xl`, `shadow-sm`, hover `shadow-md` (no layout-shifting scale)
- Buttons: large radius (`rounded-full` for primary CTAs)
- Status: tinted pills, never color-only

## Motion

- 180–240ms color/shadow transitions
- Respect `prefers-reduced-motion`
- No emoji as icons — Lucide only

## Trust / CIS

- Country + currency always visible in chrome
- Listing price shows source currency and converted amounts (BYN / RUB / KZT)
