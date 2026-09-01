export function serializeListing(listing: {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  country: string;
  city: string;
  condition: string;
  deliveryModes: string[];
  status: string;
  categoryId: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  listingTrustScore?: number | null;
  aiRiskLevel?: string | null;
  aiAssessment?: Record<string, unknown> | null;
  aiAssessedAt?: Date | null;
  moderationNote?: string | null;
}) {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
    currency: listing.currency,
    country: listing.country,
    city: listing.city,
    condition: listing.condition,
    deliveryModes: listing.deliveryModes,
    status: listing.status,
    categoryId: listing.categoryId,
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    listingTrustScore: listing.listingTrustScore ?? null,
    aiRiskLevel: listing.aiRiskLevel ?? null,
    aiAssessment: listing.aiAssessment ?? null,
    aiAssessedAt: listing.aiAssessedAt?.toISOString() ?? null,
    moderationNote: listing.moderationNote ?? null,
  };
}
