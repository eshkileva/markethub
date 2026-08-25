# Купилко — Design Master

C2C marketplace for CIS: BY / RU / KZ.

## Design Direction

Купилко — современный consumer marketplace, а не generic SaaS dashboard и не копия Avito/Kufar.

Визуальное ощущение:

- modern
- trustworthy
- premium
- friendly
- slightly playful
- conversion-oriented

Главная идея бренда:

> Find a good deal. Sell quickly.

Основная визуальная формула:

**Plum/Violet = Brand & Navigation**  
**Orange = Action & Conversion**  
**Green = Trust & Success**

Не использовать цвета декоративно без смысла.

---

## Themes

Поддерживать:

- Light
- Dark
- System

Dark theme не должен быть простой инверсией Light.

### Light

```css
canvas: #F4EFE6;
surface: #FFFDF8;
surface-secondary: #F8F3EB;

sidebar: #1C0B33;
sidebar-muted: #C4B5D6;

primary: #6D28D9;
primary-hover: #5B21B6;

accent: #EA580C;
accent-hover: #C2410C;

text: #1A1225;
muted: #5C5268;
border: #E4D8C8;

success: #15803D;
warning: #C2410C;
danger: #BE123C;
info: #2563EB;

Dark
canvas: #0D0A12;
surface: #17121F;
surface-secondary: #21182B;

sidebar: #09060D;
sidebar-muted: #A99DB5;

primary: #8B5CF6;
primary-hover: #A78BFA;

accent: #FB6A1B;
accent-hover: #F97316;

text: #FAF7FF;
muted: #A99DB5;
border: #33283D;

success: #22C55E;
warning: #FB923C;
danger: #FB7185;
info: #60A5FA;
Brand

Название: Купилко

Brand mark: стилизованная повернутая «К» в rounded square.

Использовать «К» также в:

favicon
loading
empty states
placeholders
success states

Не злоупотреблять логотипом.

Typography
Display / Logo

Unbounded

Weights: 500 / 600 / 700.

Использовать для:

logo
крупных заголовков
важных feature numbers
UI

Manrope

Weights: 400 / 500 / 600 / 700.

Scale:

12 / 14 / 16 / 18 / 24 / 32 / 40

Prices и числовые значения использовать с tabular lining numbers.

Layout

Основной desktop layout:

┌──────────────┬──────────────────────────────┐
│   PLUM       │                              │
│   SIDEBAR    │         MAIN CONTENT         │
│              │                              │
│   Brand      │ Search / Filters / Listings  │
│   Navigation │                              │
│   Categories │                              │
└──────────────┴──────────────────────────────┘
persistent plum sidebar;
warm canvas;
ivory surfaces;
ограниченная ширина контента;
responsive;
mobile-first behavior.

Mobile:

bottom navigation;
sticky search;
floating + sell CTA;
filters as drawer/bottom-sheet.

Не использовать классическую структуру Header → Hero → Content → Footer.

Navigation

Основные разделы:

Главная
Каталог
Избранное
Сообщения
Мои объявления
Покупки
Продажи
Уведомления
Настройки

Active navigation = purple highlight.

Icons: Lucide only.
Не использовать emoji как UI icons.

Marketplace

Search — главный элемент интерфейса.

Search должен позволять быстро искать товары и фильтровать:

country
city
category
price
currency
condition
delivery
sorting

Country и currency всегда визуально доступны.

Пример:

🇧🇾 Минск · BYN

Поддерживаемые страны:

🇧🇾 BY / 🇷🇺 RU / 🇰🇿 KZ

Product Cards

Карточка должна быть визуально простой и ориентированной на товар.

┌──────────────────────┐
│                      │
│    PRODUCT IMAGE     │
│                      │
├──────────────────────┤
│ RTX 4070 Super       │
│                      │
│ 2 350 BYN            │
│ ≈ 72 900 RUB         │
│                      │
│ 🇧🇾 Минск             │
│ Алексей · ★ 4.8      │
└──────────────────────┘

Правила:

large product image;
price is visually dominant;
country always visible;
seller/trust visible;
favorite action;
minimal metadata.
border-radius: 20px;
shadow: shadow-sm;
hover: shadow-md;

Не использовать layout-shifting scale on hover.

Grid:

1 / 2 / 3 / 4 columns.

Price

Цена — один из главных элементов marketplace.

Пример:

2 350 BYN
≈ 72 900 RUB
≈ 280 000 KZT

Selected/user currency = primary.

Converted currencies = secondary/muted.

Если возможно определить выгодность:

🟢 Выгодная цена
На 12% ниже средней

Price comparison должен стать одной из визуальных особенностей Купилко.

Trust

Trust — ключевой элемент продукта.

Показывать:

verified seller;
rating;
completed transactions;
response time;
account age;
verified accounts.

Пример:

✓ Проверенный продавец
★ 4.8
32 сделки
Ответ < 10 мин

Статусы никогда не передавать только цветом.

Использовать icon + text + color.

Sell CTA

Продажа — ключевая conversion action.

Использовать orange только для важных conversion actions:

Разместить объявление
Продать
Купить
Предложить цену

Пример:

+ Разместить

Не использовать orange для обычных элементов.

Listing Page

Visual priority:

Product
Price
Seller
Trust
Country / city
Delivery
Description
Characteristics

Seller block должен быть заметным:

Алексей П.

★ 4.8 · 32 сделки

✓ Телефон
✓ Telegram
✓ Проверенный профиль

[ Написать продавцу ]
Status

Использовать tinted pills:

Активно
На модерации
Продано
Заблокировано

Всегда:

icon + text + color

Buttons

Все основные buttons:

rounded-full

Hierarchy:

Primary → Purple
Conversion → Orange
Secondary → Border / neutral
Destructive → Red

На одном экране не должно быть нескольких одинаково доминирующих CTA.

Radius
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 28px
pill: 9999px

Cards: 20px.

Не делать абсолютно все элементы чрезмерно округлыми.

Motion

Использовать subtle motion:

180–240ms

Анимации:

hover;
focus;
dropdown;
drawer;
modal;
filter;
favorite;
toast;
navigation.

Не использовать чрезмерные animations, neon/glow effects или постоянное движение.

Обязательно поддерживать:

prefers-reduced-motion.

Empty / Loading

Empty states должны использовать фирменную «К».

Пример:

К

Пока здесь пусто

Попробуйте изменить фильтры
или разместите своё объявление.

[ Разместить объявление ]

Loading:

использовать skeletons;
skeleton dimensions должны соответствовать реальным компонентам;
избегать больших generic spinners.
Mobile

Mobile должен быть полноценным дизайном, а не уменьшенной desktop-версией.

Bottom navigation:

Главная
Каталог
+
Сообщения
Профиль

Центральный + = orange sell CTA.

Listing page:

sticky CTA;
swipeable gallery;
compact seller card.
Design Personality

Ключевые branded components:

ListingCard
PriceDisplay
CurrencySwitcher
CountryBadge
TrustBadge
SellerCard
DealBadge
SellButton
CategoryCard

Особенно важны:

PriceDisplay

Показывает:

Primary price → converted prices → price status

TrustBadge

Показывает:

Verification → rating → transactions

Эти компоненты должны иметь одинаковый визуальный язык во всём приложении.

Business-oriented UI
Buyer priority

Search → Price → Comparison → Trust → Location → Delivery

Seller priority

Sell → Views → Messages → Offers → Price → Status

Marketplace priority

Trust → Conversion → Liquidity → Price transparency → Cross-border visibility

Каждый экран должен иметь:

одну главную информацию;
одно основное действие;
один узнаваемый элемент бренда.
Avoid

Не использовать:

generic SaaS dashboard aesthetics;
Avito/Kufar visual copying;
excessive gradients;
excessive glassmorphism;
neon cyberpunk;
excessive shadows;
excessive rounded containers;
emoji as UI icons;
huge hero sections;
decorative orange everywhere;
color-only statuses;
layout-shifting hover animations;
unnecessary visual complexity.
Final Principle

Купилко должен выглядеть как современный международный consumer marketplace, который пользователь может узнать без логотипа.

Visual hierarchy:

Product → Price → Trust → Location → Action

Brand hierarchy:

Plum/Violet → Orange → Green

Design goal:

Beautiful, understandable, memorable and conversion-oriented.
```
