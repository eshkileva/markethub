# MarketHub

C2C-маркетплейс для BY / RU / KZ. Один аккаунт, объявления в разных странах, цены с конвертацией, Trust Score продавца. Платежей и эскроу в MVP нет.

## Стек

- **Web:** React, Vite, TanStack Router/Query, Zustand, Tailwind
- **API:** Fastify, Drizzle, PostgreSQL, Redis, WebSocket, MinIO
- **Монорепо:** pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`)

## Запуск

```bash
cp .env.example .env
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- MinIO: http://localhost:9001

Нужны Docker (Postgres, Redis, MinIO) и Node 22+. RabbitMQ в `.env` по умолчанию выключен (`RABBITMQ_ENABLED=false`).

## Стек в Docker (без `pnpm dev`)

```bash
cp .env.example .env
pnpm stack:up
```

Приложение: http://localhost:8080  
API через тот же origin: http://localhost:8080/v1 и `/ready`. MinIO по-прежнему http://localhost:9000.

Остановка: `pnpm stack:down`. Для разработки с Vite по-прежнему `pnpm infra:up` и `pnpm dev`.

## Учётки из seed

| Роль          | Email                       | Пароль       |
| ------------- | --------------------------- | ------------ |
| Модератор     | `moderator@markethub.local` | `password12` |
| Демо-продавец | `demo@markethub.local`      | `password12` |

Seed идемпотентный: категории, модератор и 10 опубликованных объявлений для каталога.

## Что работает

Регистрация и вход (JWT 15 мин + cookie `mh_refresh` 30 дней), каталог с фильтрами и поиском, объявления с фото и характеристиками, избранное, чаты REST + WS, бронь/продажа, покупки, отзывы и Trust Score, жалобы и модерация, уведомления, профиль и настройки, верификация продавца модератором.

## Вне MVP (не сделано)

Платежи и эскроу, OAuth Google/VK/Telegram, почта и SMS, премодерация объявлений, карты и полнотекст, i18n, нативные приложения.

План слайсов: [`docs/mvp-plan.md`](docs/mvp-plan.md).
