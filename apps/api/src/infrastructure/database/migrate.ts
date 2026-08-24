import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { loadConfig } from '../../config/env.js';

loadDotenv({ path: path.resolve(process.cwd(), '../../.env') });
loadDotenv();

async function main() {
  const config = loadConfig();
  const client = postgres(config.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  const migrationsFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../drizzle',
  );
  await migrate(db, { migrationsFolder });
  await client.end();
  console.log('Migrations applied');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
