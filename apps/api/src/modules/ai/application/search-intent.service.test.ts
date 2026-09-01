import { describe, expect, it, vi } from 'vitest';
import { SearchIntentService } from './search-intent.service.js';

function config(enabled = true) {
  return { aiEnabled: enabled } as never;
}

function aiLogger() {
  return { success: vi.fn(), failure: vi.fn() };
}

describe('SearchIntentService', () => {
  it('falls back to plain query when AI is disabled', async () => {
    const service = new SearchIntentService(
      { listLeafCategories: vi.fn(async () => []) } as never,
      {} as never,
      config(false),
      aiLogger() as never,
    );

    const result = await service.parse({ q: 'iphone 13', country: 'RU' });
    expect(result).toEqual({ q: 'iphone 13', country: 'RU', aiEnabled: false });
  });

  it('maps AI JSON into catalog filters', async () => {
    const service = new SearchIntentService(
      {
        listLeafCategories: vi.fn(async () => [
          { id: '1', slug: 'laptops', nameRu: 'Ноутбуки', parentSlug: 'computers' },
        ]),
      } as never,
      {
        chatJson: vi.fn(async () => ({
          q: 'ноутбук',
          categorySlug: 'laptops',
          country: 'RU',
          maxPrice: 50_000,
          currency: 'RUB',
          condition: 'used',
        })),
      } as never,
      config(true),
      aiLogger() as never,
    );

    const result = await service.parse({ q: 'ноутбук для учёбы до 50000', country: 'RU' });
    expect(result.categorySlug).toBe('laptops');
    expect(result.maxPrice).toBe(50_000);
    expect(result.aiEnabled).toBe(true);
  });
});
