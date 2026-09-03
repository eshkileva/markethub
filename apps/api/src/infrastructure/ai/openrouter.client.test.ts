import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenRouterClient } from './openrouter.client.js';
import { RateLimitError } from '../../shared/errors/app-error.js';

describe('OpenRouterClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps provider 429 to RateLimitError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('rate limited', { status: 429 })),
    );
    const client = new OpenRouterClient({
      aiEnabled: true,
      OPENROUTER_API_KEY: 'test',
      OPENROUTER_MODEL: 'test/model',
      OPENROUTER_VISION_MODEL: 'test/vision',
      PUBLIC_API_URL: 'http://localhost:3000',
      isDev: false,
    } as never);

    const error = await client
      .chatJson([{ role: 'user', content: 'hello' }], {
        logger: { success: vi.fn(), failure: vi.fn() } as never,
      })
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).toMatchObject({ statusCode: 429, code: 'RATE_LIMIT' });
  });
});
