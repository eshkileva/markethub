import { describe, expect, it, vi } from 'vitest';
import { ListingCopilotService } from './listing-copilot.service.js';

vi.mock('../../../infrastructure/ai/resolve-image-for-ai.js', () => ({
  resolveImageForAi: vi.fn(async () => 'data:image/jpeg;base64,Zm9v'),
}));

function config() {
  return { aiEnabled: true, OPENROUTER_MODEL: 'test/model', OPENROUTER_VISION_MODEL: 'test/vision' } as never;
}

function deps() {
  return {
    usageLimiter: { assertCopilotQuota: vi.fn(async () => undefined) },
    aiLogger: { success: vi.fn(), failure: vi.fn() },
  };
}

describe('ListingCopilotService', () => {
  it('maps AI draft into listing suggestions and trust assessment', async () => {
    const repo = {
      listLeafCategories: vi.fn(async () => [
        { id: 'cat-1', slug: 'smartphones', nameRu: 'Смартфоны', parentSlug: 'phones' },
      ]),
      sellerSignals: vi.fn(async () => ({
        trustScore: 60,
        emailVerified: true,
        isVerified: false,
        accountAgeDays: 30,
        listingCount: 2,
      })),
      findCategoryBySlug: vi.fn(async () => ({ id: 'cat-1', slug: 'smartphones' })),
      listCategoryAttributes: vi.fn(async () => [
        {
          id: 'attr-1',
          key: 'manufacturer',
          labelRu: 'Производитель',
          type: 'string',
          options: null,
        },
      ]),
      priceStats: vi.fn(async () => ({
        min: 40_000,
        max: 60_000,
        median: 50_000,
        sampleSize: 8,
      })),
    };
    const openRouter = {
      model: 'test/model',
      visionModel: 'test/vision',
      chatJson: vi.fn(async () => ({
        title: 'iPhone 13 128GB',
        description: 'Телефон в хорошем состоянии, без сколов.',
        categorySlug: 'smartphones',
        condition: 'used',
        attributes: { manufacturer: 'Apple' },
        suggestedPrice: 48_000,
        riskScore: 12,
        riskReasons: ['Фото соответствует описанию'],
      })),
    };

    const { usageLimiter, aiLogger } = deps();
    const service = new ListingCopilotService(
      repo as never,
      openRouter as never,
      config(),
      {} as never,
      usageLimiter as never,
      aiLogger as never,
    );
    const result = await service.analyze('seller-1', {
      imageUrl: 'https://example.com/phone.jpg',
      country: 'RU',
      currency: 'RUB',
    });

    expect(result.title).toContain('iPhone');
    expect(result.categorySlug).toBe('smartphones');
    expect(result.attributes[0]?.value).toBe('Apple');
    expect(result.assessment.listingTrustScore).toBeGreaterThan(0);
    expect(result.assessment.baseRiskScore).toBeGreaterThan(0);
    expect(result.assessment.price.sampleSize).toBe(8);
    expect(usageLimiter.assertCopilotQuota).toHaveBeenCalledWith('seller-1');
  });

  it('assesses listing on publish server-side', async () => {
    const repo = {
      findListingForAssessment: vi.fn(async () => ({
        id: 'listing-1',
        sellerId: 'seller-1',
        categoryId: 'cat-1',
        categorySlug: 'smartphones',
        title: 'iPhone 13',
        description: 'Продаю телефон в хорошем состоянии.',
        price: 48_000,
        currency: 'RUB',
        country: 'RU',
        condition: 'used',
        coverImageUrl: 'https://example.com/phone.jpg',
      })),
      sellerSignals: vi.fn(async () => ({
        trustScore: 60,
        emailVerified: true,
        isVerified: false,
        accountAgeDays: 30,
        listingCount: 2,
      })),
      priceStats: vi.fn(async () => ({
        min: 40_000,
        max: 60_000,
        median: 50_000,
        sampleSize: 8,
      })),
    };
    const openRouter = {
      model: 'test/model',
      visionModel: 'test/vision',
      chatJson: vi.fn(async () => ({
        riskScore: 18,
        riskReasons: ['Фото соответствует описанию'],
      })),
    };
    const { aiLogger } = deps();
    const service = new ListingCopilotService(
      repo as never,
      openRouter as never,
      config(),
      {} as never,
      { assertCopilotQuota: vi.fn() } as never,
      aiLogger as never,
    );

    const assessment = await service.assessForPublish('seller-1', 'listing-1');
    expect(assessment?.listingTrustScore).toBeGreaterThan(0);
    expect(assessment?.riskLevel).toBeDefined();
  });
});
