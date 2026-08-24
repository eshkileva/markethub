import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { AppConfig } from '../../config/env.js';
import * as schema from './schema/index.js';

export type Database = ReturnType<typeof createDatabase>['db'];

export function createDatabase(config: AppConfig) {
  const client = postgres(config.DATABASE_URL, {
    max: 10,
    prepare: false,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}
