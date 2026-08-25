import type { MouseEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import type { ConvertedAmounts, CurrencyCode } from '@markethub/shared';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PriceDisplay } from '@/shared/ui/price-display';
import { CountryBadge } from '@/shared/ui/country-badge';
import { cn } from '@/shared/lib/cn';
import { useFavoriteToggle } from '@/features/favorites/model/use-favorite-toggle';
import { ListingImage } from '@/entities/listing/ui/ListingImage';
import { useUiStore } from '@/shared/model/stores';

export type ProductCardData = {
  id: string;
  title: string;
  price: number;
  currency: CurrencyCode;
  converted?: ConvertedAmounts;
  city: string;
  country: string;
  imageUrl: string | null;
  publishedAt: string | null;
  isFavorite?: boolean;
};

export function ProductCard({
  item,
  layout = 'grid',
}: {
  item: ProductCardData;
  layout?: 'grid' | 'list';
}) {
  const toggle = useFavoriteToggle();
  const favorited = Boolean(item.isFavorite);
  const preferred = useUiStore((s) => s.displayCurrency);

  function onFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggle.mutate({ listingId: item.id, next: !favorited });
  }

  const price = (
    <PriceDisplay
      price={item.price}
      currency={item.currency}
      converted={item.converted}
      preferred={preferred}
      size={layout === 'list' ? 'sm' : 'md'}
    />
  );

  if (layout === 'list') {
    return (
      <Link to="/listings/$id" params={{ id: item.id }} className="block">
        <Card className="flex overflow-hidden hover:shadow-md">
          <div className="bg-surface-secondary relative h-28 w-32 shrink-0 sm:w-40">
            {item.imageUrl ? (
              <ListingImage
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-muted flex h-full items-center justify-center text-xs">
                Нет фото
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 p-4">
            <div className="min-w-0 space-y-1">
              <div className="text-foreground truncate font-medium">{item.title}</div>
              <CountryBadge country={item.country} city={item.city} />
              {price}
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={onFavorite}
              aria-label={favorited ? 'Убрать из избранного' : 'В избранное'}
            >
              <Heart className={cn('h-4 w-4', favorited && 'fill-primary text-primary')} />
            </Button>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to="/listings/$id" params={{ id: item.id }} className="block">
      <Card className="overflow-hidden hover:shadow-md">
        <div className="bg-surface-secondary relative aspect-[4/3]">
          {item.imageUrl ? (
            <ListingImage
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted flex h-full items-center justify-center text-sm">
              Нет фото
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-3 top-3 h-9 w-9 rounded-full"
            onClick={onFavorite}
            aria-label={favorited ? 'Убрать из избранного' : 'В избранное'}
          >
            <Heart className={cn('h-4 w-4', favorited && 'fill-primary text-primary')} />
          </Button>
        </div>
        <div className="space-y-1.5 p-4">
          <div className="text-foreground line-clamp-2 text-sm font-medium">{item.title}</div>
          {price}
          <CountryBadge country={item.country} city={item.city} />
        </div>
      </Card>
    </Link>
  );
}
