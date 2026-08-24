import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { formatMoney, type CurrencyCode, type ListingStatus } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import {
  listingStatusClass,
  listingStatusLabels,
  type DealStatus,
} from '@/entities/listing/model/status';
import { useAuthStore } from '@/shared/model/stores';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

type PurchaseItem = {
  conversationId: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: { body: string; createdAt: string } | null;
  listing: {
    id: string;
    title: string;
    imageUrl: string | null;
    status: ListingStatus;
    price: number;
    currency: CurrencyCode;
    city: string;
    country: string;
  };
  seller: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
};

type PurchasesResponse = { items: PurchaseItem[] };

const filters: Array<{ id: 'all' | DealStatus; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'published', label: 'В продаже' },
  { id: 'reserved', label: 'Бронь' },
  { id: 'sold', label: 'Продано' },
];

export function PurchasesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | DealStatus>('all');

  const query = useQuery({
    queryKey: ['purchases', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<PurchasesResponse>('/v1/purchases', { token }),
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Покупки</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите, чтобы видеть объявления, по которым вы пишете продавцам.</p>
          <Button onClick={() => void navigate({ to: '/auth' })}>Войти</Button>
        </CardContent>
      </Card>
    );
  }

  const items = query.data?.items ?? [];
  const visible = status === 'all' ? items : items.filter((item) => item.listing.status === status);
  const publishedCount = items.filter((item) => item.listing.status === 'published').length;
  const reservedCount = items.filter((item) => item.listing.status === 'reserved').length;
  const soldCount = items.filter((item) => item.listing.status === 'sold').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Покупки</h1>
        <p className="text-muted text-sm">
          Здесь диалоги, где вы покупатель. Оплата в MVP не нужна — договорённость в чате.
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

      {query.isLoading ? <Card className="h-40 animate-pulse bg-slate-100" /> : null}
      {!query.isLoading && visible.length === 0 ? (
        <Card>
          <CardContent className="text-muted p-6 text-sm">
            {items.length === 0 ? (
              <>
                Пока пусто. Найдите объявление в{' '}
                <Link to="/catalog" className="text-primary">
                  каталоге
                </Link>{' '}
                и напишите продавцу.
              </>
            ) : (
              'В этом статусе покупок нет.'
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <Card key={item.conversationId} className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="bg-linear-to-br h-28 w-full shrink-0 overflow-hidden rounded-xl from-violet-100 to-slate-100 sm:h-24 sm:w-36">
                  {item.listing.imageUrl ? (
                    <img
                      src={item.listing.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-muted flex h-full items-center justify-center text-xs">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={listingStatusClass[item.listing.status]}>
                      {listingStatusLabels[item.listing.status]}
                    </Badge>
                    {item.unreadCount > 0 ? (
                      <Badge className="bg-primary/10 text-primary">{item.unreadCount} новых</Badge>
                    ) : null}
                    <span className="text-muted text-xs">
                      {new Date(item.updatedAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <Link
                    to="/listings/$id"
                    params={{ id: item.listing.id }}
                    className="text-foreground hover:text-primary block truncate font-medium"
                  >
                    {item.listing.title}
                  </Link>
                  <div className="text-muted text-sm">
                    {formatMoney(item.listing.price, item.listing.currency)} · {item.listing.city},{' '}
                    {item.listing.country}
                    {item.seller ? ` · ${item.seller.displayName ?? item.seller.username}` : ''}
                  </div>
                  {item.lastMessage ? (
                    <p className="text-muted truncate text-sm">{item.lastMessage.body}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                  <Button asChild size="sm">
                    <Link to="/messages" search={{ conversation: item.conversationId }}>
                      Чат
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/listings/$id" params={{ id: item.listing.id }}>
                      Объявление
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
