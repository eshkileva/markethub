# Production

Web is a static SPA. API needs Postgres, Redis, and object storage.

## Local full stack

`pnpm stack:up` — app on http://localhost:8080. Not for a public server: it publishes Postgres, Redis, and MinIO.

## Server (API + media)

Copy `.env.production.example` to `.env`, set secrets and hostnames (`API_SITE`, `MEDIA_SITE`, `WEB_ORIGIN`, `PUBLIC_API_URL`, `S3_PUBLIC_URL`). Web origin and API host must be the same site (example: `example.com` and `api.example.com`) or the refresh cookie will not be sent.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy listens on 80/443. Do not publish Postgres, Redis, or MinIO on the host.

`GET https://<API_SITE>/ready` should return `{"status":"ready"}`.

## Static web

Build with `VITE_API_URL` set to `PUBLIC_API_URL`. `vercel.json` at the repo root builds `apps/web` and rewrites unknown paths to `index.html`. Point the web domain at that host and set `WEB_ORIGIN` on the API to the same origin (no trailing slash, one host — redirect `www` if needed).
