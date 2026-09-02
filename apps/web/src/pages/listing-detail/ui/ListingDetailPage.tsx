import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import { PriceDisplay } from '@/shared/ui/price-display';
import { CountryBadge } from '@/shared/ui/country-badge';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { useFavoriteToggle } from '@/features/favorites/model/use-favorite-toggle';
import { mapDealError, useListingDeal } from '@/features/listings/model/use-listing-deal';
import { ListingDealActions } from '@/features/listings/ui/ListingDealActions';
import { deliveryModeLabels, listingConditionLabels } from '@/entities/listing/model/labels';
import { listingStatusLabels } from '@/entities/listing/model/status';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';
import { LeaveReviewCard } from '@/features/reviews/ui/LeaveReviewCard';
import { ReportForm } from '@/features/reports/ui/ReportForm';
import type { ListingDetail } from '@/pages/listing-detail/model/types';
import { ListingAttributes } from '@/pages/listing-detail/ui/ListingAttributes';
import { ListingGallery } from '@/pages/listing-detail/ui/ListingGallery';
import { ListingBuyerBrief } from '@/features/buyer/ui/ListingBuyerBrief';
import { ListingSimilarSection } from '@/pages/listing-detail/ui/ListingSimilarSection';
import { AiPagePitch } from '@/features/ai/ui/AiPagePitch';
import { AuthRequiredHint } from '@/features/auth/ui/AuthGuestBanner';
import { formatMoney, SITE_NAME, type CurrencyCode } from '@markethub/shared';
import { SeoHead, siteOrigin } from '@/shared/lib/seo-head';

export function ListingDetailPage({ listingId }: { listingId: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const preferred = useUiStore((s) => s.displayCurrency);
  const navigate = useNavigate();
  const favorite = useFavoriteToggle();
  const deal = useListingDeal();

  const listingQuery = useQuery({
    queryKey: ['listing', listingId, token],
    queryFn: () => apiRequest<ListingDetail>(`/v1/listings/${listingId}`, { token }),
  });

  const startChat = useMutation({
    mutationFn: () =>
      apiRequest<{ id: string }>('/v1/conversations', {
        method: 'POST',
        token,
        body: { listingId },
      }),
    onSuccess: (conversation) =>
      navigate({ to: '/messages', search: { conversation: conversation.id } }),
  });

  if (listingQuery.isLoading) {
    return <Card className="bg-surface-secondary h-80 animate-pulse" />;
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <Card>
        <SeoHead
          title={`Объявление не найдено — ${SITE_NAME}`}
          description="Такого объявления нет или оно снято с публикации."
          noindex
        />
        <CardHeader>
          <CardTitle>Объявление не найдено</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link to="/">На главную</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const listing = listingQuery.data;
  const isOwner = listing.seller?.id === user?.id;
  const listingCanonical = `${siteOrigin()}/listings/${listing.id}`;
  const listingImage = listing.images[0]?.url ?? null;
  const listingIndexable = listing.status === 'published';

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[1.6fr_1fr]', !isOwner && 'pb-20 lg:pb-0')}>
      <SeoHead
        title={`${listing.title} — ${listing.city} | ${SITE_NAME}`}
        description={`${listing.title} — ${formatMoney(listing.price, listing.currency as CurrencyCode)}, ${listing.city}. Объявление на Купилко.`}
        canonical={listingCanonical}
        noindex={!listingIndexable}
        ogType="product"
        ogImage={listingImage}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: listing.title,
          description: listing.description,
          image: listing.images.map((item) => item.url),
          offers: {
            '@type': 'Offer',
            url: listingCanonical,
            price: String(listing.price),
            priceCurrency: listing.currency,
            availability:
              listing.status === 'published'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/SoldOut',
          },
        }}
      />
      {!isOwner ? (
        <div className="lg:col-span-2">
          <AiPagePitch page="listing-detail" compact />
        </div>
      ) : null}
      <div className="space-y-4">
        <ListingGallery key={listing.id} title={listing.title} images={listing.images} />
        <ListingAttributes items={listing.attributes ?? []} />
        {!isOwner ? (
          <ListingBuyerBrief
            categorySlug={listing.categorySlug}
            listingTrustScore={listing.listingTrustScore}
            aiRiskLevel={listing.aiRiskLevel}
            assessment={listing.aiAssessment}
          />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {listing.description}
          </CardContent>
        </Card>
        {!isOwner ? (
          <ListingSimilarSection
            listingId={listing.id}
            categoryId={listing.categoryId}
            price={listing.price}
            currency={listing.currency}
          />
        ) : null}
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary">
                {listingStatusLabels[listing.status]}
              </Badge>
              <Badge className="text-muted bg-surface-secondary">
                {listingConditionLabels[listing.condition]}
              </Badge>
            </div>
            {listing.status === 'reserved' ? (
              <p className="text-muted text-sm">Скрыто из каталога, пока действует бронь.</p>
            ) : null}
            <h1 className="font-display text-2xl font-semibold tracking-tight">{listing.title}</h1>
            <PriceDisplay
              price={listing.price}
              currency={listing.currency}
              converted={listing.converted}
              preferred={preferred}
              size="lg"
            />
            <CountryBadge country={listing.country} city={listing.city} />
            <div className="flex flex-wrap gap-2">
              {listing.deliveryModes.map((mode) => (
                <Badge key={mode} className="bg-blue-50 text-blue-700">
                  {deliveryModeLabels[mode]}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                {isOwner ? (
                  listing.status === 'sold' ? (
                    <Button className="flex-1" disabled>
                      Продано
                    </Button>
                  ) : (
                    <Button className="flex-1" asChild>
                      <Link to="/listings/$id/edit" params={{ id: listing.id }}>
                        Редактировать
                      </Link>
                    </Button>
                  )
                ) : (
                  <Button
                    className="flex-1"
                    disabled={startChat.isPending}
                    onClick={() => {
                      if (!token) {
                        void navigate({ to: '/auth' });
                        return;
                      }
                      startChat.mutate();
                    }}
                  >
                    {token ? 'Написать продавцу' : 'Войти, чтобы написать'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={listing.isFavorite ? 'Убрать из избранного' : 'В избранное'}
                  onClick={() =>
                    favorite.mutate({ listingId: listing.id, next: !listing.isFavorite })
                  }
                >
                  <Heart
                    className={cn('h-4 w-4', listing.isFavorite && 'fill-primary text-primary')}
                  />
                </Button>
              </div>
              {!isOwner ? (
                <AuthRequiredHint action="написать продавцу и добавить в избранное" />
              ) : null}
              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <ListingDealActions
                    listingId={listing.id}
                    status={listing.status}
                    deal={deal}
                    size="default"
                  />
                </div>
              ) : null}
              {isOwner && deal.error ? (
                <p className="text-danger text-sm">{mapDealError(deal.error.message)}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {listing.seller ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Продавец</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link
                  to="/profile/$username"
                  params={{ username: listing.seller.username }}
                  className="text-primary font-medium"
                >
                  {listing.seller.displayName ?? listing.seller.username}
                </Link>
                <div className="text-muted">
                  Trust Score продавца {listing.seller.trustScore}
                  {listing.seller.isVerified ? ' · проверен' : ''}
                </div>
                {listing.listingTrustScore != null ? (
                  <div className="text-muted">
                    Trust Score объявления {listing.listingTrustScore}
                    {listing.aiRiskLevel ? ` · риск ${listing.aiRiskLevel}` : ''}
                  </div>
                ) : null}
              </CardContent>
            </Card>
            <LeaveReviewCard listingId={listing.id} sellerId={listing.seller.id} />
            {user?.id !== listing.seller.id ? (
              <ReportForm listingId={listing.id} userId={listing.seller.id} />
            ) : null}
          </>
        ) : null}
      </div>
      {!isOwner ? (
        <div className="border-border bg-card/95 fixed inset-x-0 bottom-16 z-20 rounded-t-2xl border-t p-3 shadow-md backdrop-blur lg:hidden">
          <Button
            className="w-full"
            disabled={startChat.isPending}
            onClick={() => {
              if (!token) {
                void navigate({ to: '/auth' });
                return;
              }
              startChat.mutate();
            }}
          >
            {token ? 'Написать продавцу' : 'Войти, чтобы написать'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
