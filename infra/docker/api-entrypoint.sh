#!/bin/sh
set -e
cd /app/apps/api
pnpm db:migrate
if [ "${SEED_ON_START:-false}" = "true" ]; then
  pnpm db:seed
fi
exec pnpm exec tsx src/server.ts
