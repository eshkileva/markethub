import { Redis } from 'ioredis';
import type { AppConfig } from '../../config/env.js';

export type RedisClient = Redis;

export function createRedis(config: AppConfig): RedisClient {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}
