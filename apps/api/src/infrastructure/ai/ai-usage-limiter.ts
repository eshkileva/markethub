import type { RedisClient } from '../redis/client.js';
import { RateLimitError } from '../../shared/errors/app-error.js';

function dayKey(userId: string) {
  return `ai:copilot:${userId}:${new Date().toISOString().slice(0, 10)}`;
}

export class AiUsageLimiter {
  constructor(
    private readonly redis: RedisClient,
    private readonly dailyLimit: number,
  ) {}

  async assertCopilotQuota(userId: string) {
    if (this.dailyLimit <= 0) return;

    const key = dayKey(userId);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 86_400 * 2);
    }
    if (count > this.dailyLimit) {
      throw new RateLimitError(
        `Достигнут дневной лимит AI-помощника (${this.dailyLimit}). Попробуйте завтра.`,
      );
    }
  }
}
