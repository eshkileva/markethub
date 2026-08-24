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

Остановка: `pnpm stack:down`. Для разработки с Vite — `pnpm infra:up` и `pnpm dev`.

Выкладка API на сервер и статики отдельно: [`docs/deploy.md`](docs/deploy.md).

## Прод: Vercel + VPS (`kupilko.store`)

Фронт на Vercel, бэк на VPS. Сначала DNS `api` / `media` на IP сервера, потом VPS, потом Vercel.

### 1. DNS

| Имя     | Тип       | Значение                                             |
| ------- | --------- | ---------------------------------------------------- |
| `api`   | A         | IP VPS                                               |
| `media` | A         | IP VPS                                               |
| `@`     | A / ALIAS | как скажет Vercel для apex (после шага 3)            |
| `www`   | CNAME     | `cname.vercel-dns.com` или редирект на apex в Vercel |

### 2. VPS

Снаружи только 22 / 80 / 443. Не публикуй 5432, 6379, 9000.

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

git clone https://github.com/eshkileva/markethub.git
cd markethub
git checkout main
git pull

cp .env.production.example .env
nano .env
```

В `.env` обязательно:

- `ACME_EMAIL` — твой ящик
- `API_SITE=api.kupilko.store` и `MEDIA_SITE=media.kupilko.store` — **без** `https://`
- `PUBLIC_API_URL=https://api.kupilko.store`
- `WEB_ORIGIN=https://kupilko.store` — без слэша в конце
- `S3_PUBLIC_URL=https://media.kupilko.store/markethub`
- пароли: `POSTGRES_PASSWORD`, `JWT_SECRET` (≥32), `COOKIE_SECRET` (≥16), `S3_ACCESS_KEY`, `S3_SECRET_KEY`

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 16   # COOKIE_SECRET / пароли
```

Первый запуск с сидом (`SEED_ON_START=true` в шаблоне), потом можно выключить.

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
curl -sS https://api.kupilko.store/ready
```

Должно быть `{"status":"ready"}`. Если сертификат не выписался — DNS `api`/`media` ещё не смотрит на этот IP, подожди TTL и `docker compose -f docker-compose.prod.yml restart caddy`.

### 3. Vercel

1. [vercel.com](https://vercel.com) → Add Project → этот GitHub-репозиторий.
2. Root Directory: **корень репо**, не `apps/web`. Framework: Other. Node 22.
3. Environment Variable: `VITE_API_URL` = `https://api.kupilko.store` (Production).
4. Deploy. Потом Project → Settings → Domains → `kupilko.store`. `www` редиректить на apex.
5. Apex в DNS — A/ALIAS, которые покажет Vercel.

Не оставляй основной URL как `*.vercel.app`. Проверка: открыть `https://kupilko.store`, залогиниться `demo@markethub.local` / `password12`.

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
