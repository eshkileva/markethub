import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { loadConfig } from './config/env.js';
import { createDatabase } from './infrastructure/database/client.js';
import { createRedis } from './infrastructure/redis/client.js';
import { createObjectStorage } from './infrastructure/storage/s3.js';
import { HybridEventBus } from './infrastructure/messaging/rabbitmq-event-bus.js';
import { buildApp } from './app.js';

loadDotenv({ path: resolve(process.cwd(), '../../.env') });
loadDotenv();

async function main() {
  const config = loadConfig();
  const { db, client } = createDatabase(config);
  const redis = createRedis(config);
  await redis.connect();
  const storage = createObjectStorage(config);
  const events = new HybridEventBus(config, console);
  await events.connect();

  try {
    await storage.ensureBucket();
  } catch (error) {
    console.warn('S3 bucket ensure skipped:', error);
  }

  const app = await buildApp({ config, db, redis, storage, events });

  const shutdown = async () => {
    await app.close();
    await events.close();
    await redis.quit();
    await client.end();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ host: config.API_HOST, port: config.API_PORT });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
