import type {
  CurrencyCode,
  DeliveryMode,
  ListingAiAssessment,
  ListingCondition,
  ListingStatus,
} from '@markethub/shared';

export type ListingDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  converted: { RUB: number; BYN: number; KZT: number };
  country: string;
  city: string;
  condition: ListingCondition;
  deliveryModes: DeliveryMode[];
  status: ListingStatus;
  categoryId: string;
  categorySlug?: string | null;
  images: Array<{ id: string; url: string }>;
  attributes: Array<{ attributeId: string; value: string; labelRu: string }>;
  isFavorite?: boolean;
  seller: {
    id: string;
    username: string;
    displayName: string | null;
    trustScore: number;
    isVerified: boolean;
  } | null;
  listingTrustScore?: number | null;
  aiRiskLevel?: 'low' | 'medium' | 'high' | null;
  aiAssessment?: ListingAiAssessment | null;
};
