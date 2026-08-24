import type {
  CurrencyCode,
  DeliveryMode,
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
};
