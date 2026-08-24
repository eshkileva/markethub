import type { MouseEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatMoney, type CurrencyCode } from '@markethub/shared';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import { useFavoriteToggle } from '@/features/favorites/model/use-favorite-toggle';

export type ProductCardData = {
  id: string;
  title: string;
  price: number;
  currency: CurrencyCode;
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

  function onFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggle.mutate({ listingId: item.id, next: !favorited });
  }

  if (layout === 'list') {
    return (
      <Link to="/listings/$id" params={{ id: item.id }} className="block">
        <Card className="flex overflow-hidden hover:shadow-md">
          <div className="relative h-28 w-40 shrink-0 bg-gradient-to-br from-violet-100 to-slate-100">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-muted flex h-full items-center justify-center text-xs">
                Нет фото
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 p-4">
            <div className="min-w-0 space-y-1">
              <div className="text-foreground truncate font-medium">{item.title}</div>
              <div className="text-muted flex items-center gap-1 text-xs">
                <MapPin className="h-3.5 w-3.5" />
                {item.city}, {item.country}
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {formatMoney(item.price, item.currency)}
              </div>
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
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
      <Link to="/listings/$id" params={{ id: item.id }} className="block">
        <Card className="overflow-hidden hover:shadow-md">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-violet-100 to-slate-100">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
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
            <div className="text-lg font-semibold tabular-nums">
              {formatMoney(item.price, item.currency)}
            </div>
            <div className="text-foreground line-clamp-2 text-sm font-medium">{item.title}</div>
            <div className="text-muted flex items-center gap-1 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              {item.city}, {item.country}
              {item.publishedAt
                ? ` • ${new Date(item.publishedAt).toLocaleDateString('ru-RU')}`
                : null}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
