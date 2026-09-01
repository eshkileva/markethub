import type {
  AiRiskLevel,
  ConvertedAmounts,
  CountryCode,
  CurrencyCode,
  DeliveryMode,
  ListingAiAssessment,
  ListingCondition,
  ListingStatus,
  PriceVerdict,
} from '@markethub/shared';

export type Paginated<T> = {
  items: T[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export type ListingCard = {
  id: string;
  title: string;
  price: number;
  currency: CurrencyCode;
  converted?: ConvertedAmounts;
  city: string;
  country: string;
  imageUrl: string | null;
  publishedAt: string | null;
  listingTrustScore?: number | null;
  aiRiskLevel?: AiRiskLevel | null;
  priceVerdict?: PriceVerdict | null;
  isFavorite?: boolean;
};

export type ListingDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  converted: ConvertedAmounts;
  country: CountryCode | string;
  city: string;
  condition: ListingCondition;
  deliveryModes: DeliveryMode[];
  status: ListingStatus;
  categoryId: string;
  categorySlug?: string | null;
  images: Array<{ id: string; url: string }>;
  attributes: Array<{ attributeId: string; value: string; labelRu?: string }>;
  isFavorite?: boolean;
  seller: {
    id: string;
    username: string;
    displayName: string | null;
    trustScore: number;
    isVerified: boolean;
  } | null;
  listingTrustScore?: number | null;
  aiRiskLevel?: AiRiskLevel | null;
  aiAssessment?: ListingAiAssessment | null;
};
