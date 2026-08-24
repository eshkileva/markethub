import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, type CurrencyCode, type ListingStatus } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { mapDealError, useListingDeal } from '@/features/listings/model/use-listing-deal';
import { ListingDealActions } from '@/features/listings/ui/ListingDealActions';
import {
  isDealStatus,
  listingStatusClass,
  listingStatusLabels,
  type DealStatus,
} from '@/entities/listing/model/status';
import { useAuthStore } from '@/shared/model/stores';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

type MineItem = {
  id: string;
  title: string;
  price: number;
  currency: CurrencyCode;
  city: string;
  country: string;
  status: ListingStatus;
  imageUrl: string | null;
  updatedAt: string;
};

type MineResponse = { items: MineItem[] };

const filters: Array<{ id: 'all' | DealStatus; label: string }> = [
  { id: 'all', label: 'Все сделки' },
  { id: 'published', label: 'В продаже' },
  { id: 'reserved', label: 'Бронь' },
  { id: 'sold', label: 'Продано' },
];

export function SalesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const deal = useListingDeal();
  const [status, setStatus] = useState<'all' | DealStatus>('all');

  const query = useQuery({
    queryKey: ['listings', 'mine', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<MineResponse>('/v1/listings/mine', { token }),
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Продажи</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите, чтобы бронировать объявления и отмечать продажи.</p>
          <Button onClick={() => void navigate({ to: '/auth' })}>Войти</Button>
        </CardContent>
      </Card>
    );
  }

  const deals = (query.data?.items ?? []).filter(
    (item): item is MineItem & { status: DealStatus } => isDealStatus(item.status),
  );
  const visible = status === 'all' ? deals : deals.filter((item) => item.status === status);
  const publishedCount = deals.filter((item) => item.status === 'published').length;
  const reservedCount = deals.filter((item) => item.status === 'reserved').length;
  const soldCount = deals.filter((item) => item.status === 'sold').length;
  const actionError = deal.error ? mapDealError(deal.error.message) : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Продажи</h1>
        <p className="text-muted text-sm">
          Бронь скрывает объявление из каталога, пока вы договариваетесь. Продано — финальный
          статус, его можно вернуть в продажу.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-xs">В продаже</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-xs">Бронь</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{reservedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted text-xs">Продано</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{soldCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={status === item.id ? 'default' : 'secondary'}
            onClick={() => setStatus(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {actionError ? <p className="text-danger text-sm">{actionError}</p> : null}
      {query.isLoading ? <Card className="h-40 animate-pulse bg-slate-100" /> : null}
      {!query.isLoading && visible.length === 0 ? (
        <Card>
          <CardContent className="text-muted p-6 text-sm">
            {deals.length === 0 ? (
              <>
                Сделок пока нет. Опубликуйте объявление в{' '}
                <Link to="/my-listings" className="text-primary">
                  Моих объявлениях
                </Link>
                .
              </>
            ) : (
              'В этом статусе сделок нет.'
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 to-slate-100 sm:h-24 sm:w-36">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-muted flex h-full items-center justify-center text-xs">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={listingStatusClass[item.status]}>
                      {listingStatusLabels[item.status]}
                    </Badge>
                    <span className="text-muted text-xs">
                      {new Date(item.updatedAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <Link
                    to="/listings/$id"
                    params={{ id: item.id }}
                    className="text-foreground hover:text-primary block truncate font-medium"
                  >
                    {item.title}
                  </Link>
                  <div className="text-muted text-sm">
                    {formatMoney(item.price, item.currency)} · {item.city}, {item.country}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/listings/$id" params={{ id: item.id }}>
                      Открыть
                    </Link>
                  </Button>
                  <ListingDealActions listingId={item.id} status={item.status} deal={deal} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
