import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatMoney, type CurrencyCode, type ListingStatus } from '@markethub/shared';
import { Plus } from 'lucide-react';
import { apiRequest } from '@/shared/api/client';
import { listingStatusClass, listingStatusLabels } from '@/entities/listing/model/status';
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
  imageCount: number;
  updatedAt: string;
};

type MineResponse = { items: MineItem[] };

const filters: Array<{ id: 'all' | ListingStatus; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'published', label: 'Активные' },
  { id: 'draft', label: 'Черновики' },
  { id: 'archived', label: 'Снятые' },
  { id: 'rejected', label: 'Отклонённые' },
  { id: 'sold', label: 'Проданные' },
];

function mapListingError(message: string) {
  if (message === 'Add at least one image before publishing') {
    return 'Добавьте хотя бы одно фото, чтобы опубликовать';
  }
  if (message.startsWith('Missing required attributes:')) {
    return message.replace('Missing required attributes:', 'Заполните характеристики:');
  }
  if (message === 'Listing cannot be published from current status') {
    return 'С этого статуса опубликовать нельзя';
  }
  if (message === 'Only active listings can be archived') {
    return 'Снять можно только активное объявление';
  }
  return message;
}

export function MyListingsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'all' | ListingStatus>('all');

  const query = useQuery({
    queryKey: ['listings', 'mine', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<MineResponse>('/v1/listings/mine', { token }),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['listings'] }),
      queryClient.invalidateQueries({ queryKey: ['listing'] }),
    ]);
  };

  const publish = useMutation({
    mutationFn: (id: string) => apiRequest(`/v1/listings/${id}/publish`, { method: 'POST', token }),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => apiRequest(`/v1/listings/${id}/archive`, { method: 'POST', token }),
    onSuccess: invalidate,
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои объявления</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите, чтобы управлять черновиками и опубликованными объявлениями.</p>
          <Button onClick={() => void navigate({ to: '/auth' })}>Войти</Button>
        </CardContent>
      </Card>
    );
  }

  const items = query.data?.items ?? [];
  const visible = status === 'all' ? items : items.filter((item) => item.status === status);
  const actionError =
    publish.error instanceof Error
      ? mapListingError(publish.error.message)
      : archive.error instanceof Error
        ? mapListingError(archive.error.message)
        : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Мои объявления</h1>
          <p className="text-muted text-sm">{items.length} в кабинете продавца</p>
        </div>
        <Button asChild>
          <Link to="/listings/create">
            <Plus className="h-4 w-4" />
            Разместить
          </Link>
        </Button>
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
            {items.length === 0 ? (
              <>
                Пока пусто.{' '}
                <Link to="/listings/create" className="text-primary">
                  Создайте первое объявление
                </Link>
                .
              </>
            ) : (
              'В этом статусе объявлений нет.'
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
                    {item.imageCount === 0 &&
                    ['draft', 'rejected', 'archived'].includes(item.status)
                      ? ' · нужно фото'
                      : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/listings/$id" params={{ id: item.id }}>
                      Открыть
                    </Link>
                  </Button>
                  {item.status !== 'sold' ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link to="/listings/$id/edit" params={{ id: item.id }}>
                        Изменить
                      </Link>
                    </Button>
                  ) : null}
                  {['draft', 'rejected', 'archived'].includes(item.status) ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={publish.isPending || item.imageCount === 0}
                      onClick={() => publish.mutate(item.id)}
                    >
                      Опубликовать
                    </Button>
                  ) : null}
                  {item.status === 'published' || item.status === 'reserved' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={archive.isPending}
                      onClick={() => archive.mutate(item.id)}
                    >
                      Снять с продажи
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
