import type { CatalogSearch } from '@/pages/catalog/model/search';
import type { CountryCode, CurrencyCode, ListingCondition } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';

type SearchIntentResponse = {
  q?: string;
  categorySlug?: string;
  country?: CountryCode;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: CurrencyCode;
  condition?: ListingCondition;
  aiEnabled: boolean;
};

export async function resolveSmartSearch(
  rawQuery: string,
  defaults?: { country?: CountryCode },
  token?: string | null,
): Promise<CatalogSearch> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return {};

  try {
    const intent = await apiRequest<SearchIntentResponse>('/v1/ai/search-intent', {
      method: 'POST',
      token,
      skipAuth: !token,
      body: {
        q: trimmed,
        country: defaults?.country,
      },
    });

    if (!intent.aiEnabled) {
      return { q: trimmed, country: defaults?.country };
    }

    return {
      q: intent.q ?? trimmed,
      category: intent.categorySlug,
      country: intent.country ?? defaults?.country,
      city: intent.city,
      minPrice: intent.minPrice,
      maxPrice: intent.maxPrice,
      currency: intent.currency,
      condition: intent.condition,
    };
  } catch {
    return { q: trimmed, country: defaults?.country };
  }
}
