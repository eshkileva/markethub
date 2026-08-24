import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationType } from '@markethub/shared';
import { Flag, MessageSquare, Package, ShieldAlert, Star } from 'lucide-react';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';

type NotificationItem = {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
};

function asString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function copyFor(item: NotificationItem) {
  const listingTitle = asString(item.payload.listingTitle);
  const fromUsername = asString(item.payload.fromUsername);
  const authorUsername = asString(item.payload.authorUsername);
  const preview = asString(item.payload.preview);
  const rating = typeof item.payload.rating === 'number' ? item.payload.rating : null;
  const action = asString(item.payload.action);

  switch (item.type) {
    case 'message':
      return {
        title: fromUsername ? `Сообщение от @${fromUsername}` : 'Новое сообщение',
        body: preview ?? listingTitle ?? 'Откройте чат, чтобы ответить.',
        icon: MessageSquare,
      };
    case 'review':
      return {
        title: authorUsername ? `Отзыв от @${authorUsername}` : 'Новый отзыв',
        body: rating
          ? `${rating} из 5${listingTitle ? ` · ${listingTitle}` : ''}`
          : (listingTitle ?? 'Посмотрите отзыв в профиле.'),
        icon: Star,
      };
    case 'listing_hidden':
      return {
        title: 'Объявление скрыто',
        body: listingTitle
          ? `«${listingTitle}» снято модератором после жалобы.`
          : 'Модератор скрыл ваше объявление.',
        icon: ShieldAlert,
      };
    case 'report_update':
      return {
        title: action === 'resolved' ? 'Жалоба принята' : 'Жалоба отклонена',
        body:
          action === 'resolved'
            ? listingTitle
              ? `Объявление «${listingTitle}» скрыто.`
              : 'Объявление скрыто по вашей жалобе.'
            : listingTitle
              ? `По «${listingTitle}» нарушений не нашли.`
              : 'Модератор отклонил вашу жалобу.',
        icon: Flag,
      };
    case 'listing_sold':
      return {
        title: 'Объявление продано',
        body: listingTitle
          ? `«${listingTitle}» отмечено как проданное.`
          : 'Продавец отметил объявление проданным.',
        icon: Package,
      };
    default:
      return { title: 'Уведомление', body: 'Откройте, чтобы посмотреть подробности.', icon: Flag };
  }
}

export function NotificationsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', 'list', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<NotificationsResponse>('/v1/notifications?pageSize=50', { token }),
  });

  const invalidate = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['notifications'] })]);
  };

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/v1/notifications/${id}/read`, { method: 'POST', token }),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => apiRequest('/v1/notifications/read-all', { method: 'POST', token }),
    onSuccess: invalidate,
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите, чтобы видеть сообщения, отзывы и решения модерации.</p>
          <Button onClick={() => void navigate({ to: '/auth' })}>Войти</Button>
        </CardContent>
      </Card>
    );
  }

  const openItem = (item: NotificationItem) => {
    if (!item.readAt) {
      markRead.mutate(item.id);
    }
    const conversationId = asString(item.payload.conversationId);
    const listingId = asString(item.payload.listingId);
    if (item.type === 'message' && conversationId) {
      void navigate({ to: '/messages', search: { conversation: conversationId } });
      return;
    }
    if (listingId) {
      void navigate({ to: '/listings/$id', params: { id: listingId } });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-muted text-sm">
            {query.data?.unreadCount ? `${query.data.unreadCount} непрочитанных` : 'Все прочитаны'}
          </p>
        </div>
        {query.data?.unreadCount ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Прочитать все
          </Button>
        ) : null}
      </div>

      {query.isLoading ? <Card className="h-40 animate-pulse bg-slate-100" /> : null}
      {query.data?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted p-6 text-sm">
            Пока тихо — сюда придут чаты, отзывы и модерация.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {query.data?.items.map((item) => {
            const copy = copyFor(item);
            const Icon = copy.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className={cn(
                  'border-border bg-card flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-shadow duration-200 hover:shadow-md',
                  !item.readAt && 'border-primary/20 bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    item.type === 'listing_hidden'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium">{copy.title}</span>
                    <span className="text-muted shrink-0 text-xs">
                      {new Date(item.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </span>
                  <span className="text-muted mt-1 block text-sm">{copy.body}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
