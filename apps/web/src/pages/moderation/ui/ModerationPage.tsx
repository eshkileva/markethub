import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReportReason, ReportStatus } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

type ReportItem = {
  id: string;
  listingId: string | null;
  userId: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporterUsername: string;
  reportedUsername: string | null;
  listingTitle: string | null;
  listingStatus: string | null;
};

type ReportsResponse = {
  items: ReportItem[];
  total: number;
};

const reasonLabels: Record<ReportReason, string> = {
  spam: 'Спам',
  fraud: 'Мошенничество',
  prohibited: 'Запрещённый товар',
  offensive: 'Оскорбления',
  other: 'Другое',
};

const statusLabels: Record<ReportStatus, string> = {
  open: 'Открыта',
  dismissed: 'Отклонена',
  resolved: 'Объявление скрыто',
};

export function ModerationPage() {
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isModerator = role === 'moderator' || role === 'admin';

  const query = useQuery({
    queryKey: ['reports', 'open', token],
    enabled: Boolean(token) && isModerator,
    queryFn: () => apiRequest<ReportsResponse>('/v1/reports?status=open&pageSize=50', { token }),
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'dismiss' | 'hide_listing' }) =>
      apiRequest(`/v1/reports/${id}`, { method: 'PATCH', token, body: { action } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        queryClient.invalidateQueries({ queryKey: ['listing'] }),
      ]);
    },
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Модерация</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите под модератором, чтобы разбирать жалобы.</p>
          <Button onClick={() => void navigate({ to: '/auth' })}>Войти</Button>
        </CardContent>
      </Card>
    );
  }

  if (!isModerator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет доступа</CardTitle>
        </CardHeader>
        <CardContent className="text-muted text-sm">
          Эта страница только для модераторов.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Жалобы</h1>
        <p className="text-muted text-sm">{query.data?.total ?? 0} открытых обращений</p>
      </div>
      {query.isLoading ? <Card className="h-40 animate-pulse bg-slate-100" /> : null}
      {query.data?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted p-6 text-sm">Очередь пуста.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {query.data?.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-warning/10 text-warning">{statusLabels[item.status]}</Badge>
                  <Badge className="text-muted bg-slate-100">{reasonLabels[item.reason]}</Badge>
                  <span className="text-muted text-xs">
                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="text-sm">
                  От @{item.reporterUsername}
                  {item.reportedUsername ? (
                    <>
                      {' '}
                      на{' '}
                      <Link
                        to="/profile/$username"
                        params={{ username: item.reportedUsername }}
                        className="text-primary"
                      >
                        @{item.reportedUsername}
                      </Link>
                    </>
                  ) : null}
                </div>
                {item.listingId && item.listingTitle ? (
                  <Link
                    to="/listings/$id"
                    params={{ id: item.listingId }}
                    className="text-primary text-sm font-medium"
                  >
                    {item.listingTitle}
                    {item.listingStatus ? ` · ${item.listingStatus}` : ''}
                  </Link>
                ) : null}
                {item.details ? <p className="text-sm leading-relaxed">{item.details}</p> : null}
                {resolve.isError ? (
                  <p className="text-danger text-sm">
                    {resolve.error instanceof Error
                      ? resolve.error.message
                      : 'Не удалось обработать жалобу'}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate({ id: item.id, action: 'dismiss' })}
                  >
                    Отклонить
                  </Button>
                  {item.listingId ? (
                    <Button
                      type="button"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: item.id, action: 'hide_listing' })}
                    >
                      Скрыть объявление
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
