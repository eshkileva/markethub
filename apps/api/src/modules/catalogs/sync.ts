import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { loadConfig } from '../../config/env.js';
import { createDatabase } from '../../infrastructure/database/client.js';
import { CatalogsRepository } from './infrastructure/catalogs.repository.js';
import { CatalogsService } from './application/catalogs.service.js';

loadDotenv({ path: path.resolve(process.cwd(), '../../.env') });
loadDotenv();

async function main() {
  const target = process.argv[2] ?? 'all';
  const { db, client } = createDatabase(loadConfig());
  const catalogs = new CatalogsService(new CatalogsRepository(db));
  try {
    await catalogs.syncFromCli(target);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
