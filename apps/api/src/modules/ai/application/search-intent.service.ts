import type { z } from 'zod';
import type {
  CountryCode,
  CurrencyCode,
  searchIntentRequestSchema,
  searchIntentResponseSchema,
} from '@markethub/shared';
import type { AppConfig } from '../../../config/env.js';
import type { AiCallLogger } from '../../../infrastructure/ai/ai-call-logger.js';
import { OpenRouterClient } from '../../../infrastructure/ai/openrouter.client.js';
import { ValidationError } from '../../../shared/errors/app-error.js';
import type { ListingCopilotRepository } from '../infrastructure/listing-copilot.repository.js';

type SearchIntentInput = z.infer<typeof searchIntentRequestSchema>;
type SearchIntentResponse = z.infer<typeof searchIntentResponseSchema>;

function parseCurrency(value: unknown): CurrencyCode | undefined {
  if (value === 'BYN' || value === 'RUB' || value === 'KZT') return value;
  return undefined;
}

function parseCountry(value: unknown, fallback?: CountryCode): CountryCode | undefined {
  if (value === 'BY' || value === 'RU' || value === 'KZ') return value;
  return fallback;
}

function parseCondition(value: unknown): SearchIntentResponse['condition'] {
  if (value === 'new' || value === 'used' || value === 'for_parts') return value;
  return undefined;
}

const intentDraftSchema = {
  q: 'optional cleaned keyword for text search',
  categorySlug: 'one of provided leaf slugs or omit',
  country: 'BY | RU | KZ or omit',
  city: 'city name in Russian or omit',
  minPrice: 'number or omit',
  maxPrice: 'number or omit',
  currency: 'BYN | RUB | KZT or omit',
  condition: 'new | used | for_parts or omit',
};

export class SearchIntentService {
  constructor(
    private readonly repo: ListingCopilotRepository,
    private readonly openRouter: OpenRouterClient,
    private readonly config: AppConfig,
    private readonly aiLogger: AiCallLogger,
  ) {}

  async parse(input: SearchIntentInput): Promise<SearchIntentResponse> {
    if (!this.config.aiEnabled) {
      return { q: input.q, country: input.country, aiEnabled: false };
    }

    const leafCategories = await this.repo.listLeafCategories();
    if (leafCategories.length === 0) {
      return { q: input.q, country: input.country, aiEnabled: false };
    }

    const slugList = leafCategories.map((item) => `${item.slug} (${item.nameRu})`).join(', ');
    const draft = await this.openRouter.chatJson<Record<string, unknown>>(
      [
        {
          role: 'system',
          content: [
            'You parse marketplace search queries for a CIS classifieds site (BY/RU/KZ).',
            'Reply with JSON only. No markdown.',
            'Map the user query to catalog filters.',
            'Keys:',
            Object.keys(intentDraftSchema).join(', '),
            'categorySlug must be one of the provided leaf slugs when confident.',
            'Use RUB unless user mentions BYN/KZT or a country strongly implies currency.',
            'Extract price limits from phrases like "до 50000", "от 1000 до 30000".',
            'Keep q as a short keyword if useful, otherwise omit.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Leaf categories: ${slugList}`,
            input.country ? `Default country hint: ${input.country}` : null,
            `User query: ${input.q}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      {
        meta: { operation: 'search-intent' },
        logger: this.aiLogger,
      },
    );

    const categorySlug =
      typeof draft.categorySlug === 'string' &&
      leafCategories.some((item) => item.slug === draft.categorySlug)
        ? draft.categorySlug
        : undefined;

    return {
      q: typeof draft.q === 'string' && draft.q.trim() ? draft.q.trim() : undefined,
      categorySlug,
      country: parseCountry(draft.country, input.country),
      city: typeof draft.city === 'string' && draft.city.trim() ? draft.city.trim() : undefined,
      minPrice:
        typeof draft.minPrice === 'number' && draft.minPrice >= 0 ? draft.minPrice : undefined,
      maxPrice:
        typeof draft.maxPrice === 'number' && draft.maxPrice > 0 ? draft.maxPrice : undefined,
      currency: parseCurrency(draft.currency),
      condition: parseCondition(draft.condition),
      aiEnabled: true,
    };
  }

  assertEnabled() {
    if (!this.config.aiEnabled) {
      throw new ValidationError('Smart search is not configured');
    }
  }
}
