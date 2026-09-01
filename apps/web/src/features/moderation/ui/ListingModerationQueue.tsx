import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatMoney, MODERATION_RISK_LABELS, type AiRiskLevel, type CurrencyCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { ListingImage } from '@/entities/listing/ui/ListingImage';
import { ListingTrustBadge } from '@/entities/listing/ui/ListingTrustBadge';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';

type QueueItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  city: string;
  country: string;
  listingTrustScore: number | null;
  aiRiskLevel: AiRiskLevel | null;
  aiAssessment: {
    riskScore?: number;
    reasons?: string[];
    price?: { verdict?: string; median?: number | null; sampleSize?: number };
  } | null;
  createdAt: string;
  imageUrl: string | null;
  seller: {
    id: string;
    username: string;
    displayName: string | null;
    trustScore: number;
    emailVerified: boolean;
    accountAgeDays: number;
    listingCount: number;
  };
  duplicateHints: string[];
};

type QueueResponse = {
  items: QueueItem[];
  total: number;
};

const riskBadgeClass: Record<AiRiskLevel, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-900',
  low: 'bg-emerald-100 text-emerald-900',
};

export function ListingModerationQueue({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [riskFilter, setRiskFilter] = useState<'all' | AiRiskLevel>('all');
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['moderation', 'listings', riskFilter, token],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '50' });
      if (riskFilter !== 'all') params.set('riskLevel', riskFilter);
      return apiRequest<QueueResponse>(`/v1/moderation/listings?${params}`, { token });
    },
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moderation'] }),
      queryClient.invalidateQueries({ queryKey: ['listings'] }),
      queryClient.invalidateQueries({ queryKey: ['listing'] }),
    ]);
  };

  const approve = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/v1/moderation/listings/${id}/approve`, { method: 'POST', token }),
    onSuccess: invalidate,
    onError: (error) =>
      setActionError(error instanceof Error ? error.message : 'Не удалось одобрить'),
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiRequest(`/v1/moderation/listings/${id}/reject`, {
        method: 'POST',
        token,
        body: { note },
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (error) =>
      setActionError(error instanceof Error ? error.message : 'Не удалось отклонить'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'high', 'medium', 'low'] as const).map((level) => (
          <Button
            key={level}
            type="button"
            size="sm"
            variant={riskFilter === level ? 'default' : 'secondary'}
            onClick={() => setRiskFilter(level)}
          >
            {level === 'all' ? 'Все риски' : MODERATION_RISK_LABELS[level]}
          </Button>
        ))}
      </div>

      <p className="text-muted text-sm">{query.data?.total ?? 0} объявлений на проверке</p>

      {actionError ? <p className="text-danger text-sm">{actionError}</p> : null}
      {query.isLoading ? <Card className="h-40 animate-pulse bg-slate-100" /> : null}

      {query.data?.items.length === 0 && !query.isLoading ? (
        <Card>
          <CardContent className="text-muted p-6 text-sm">Очередь пуста.</CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {query.data?.items.map((item) => {
          const reasons = item.aiAssessment?.reasons ?? [];
          const rejectNote = rejectNotes[item.id] ?? '';
          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[12rem_1fr]">
                <div className="bg-surface-secondary aspect-square overflow-hidden rounded-xl lg:aspect-[4/3]">
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
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        to="/listings/$id"
                        params={{ id: item.id }}
                        className="text-lg font-semibold hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-muted text-sm">
                        {formatMoney(item.price, item.currency)} · {item.city}, {item.country}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.aiRiskLevel ? (
                        <Badge className={riskBadgeClass[item.aiRiskLevel]}>
                          {MODERATION_RISK_LABELS[item.aiRiskLevel]}
                        </Badge>
                      ) : null}
                      <ListingTrustBadge
                        score={item.listingTrustScore}
                        riskLevel={item.aiRiskLevel}
                      />
                    </div>
                  </div>

                  <p className="line-clamp-3 text-sm leading-relaxed">{item.description}</p>

                  <div className="text-muted grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      Продавец:{' '}
                      <Link
                        to="/profile/$username"
                        params={{ username: item.seller.username }}
                        className="text-primary"
                      >
                        @{item.seller.username}
                      </Link>
                    </p>
                    <p>Trust продавца: {item.seller.trustScore}</p>
                    <p>Аккаунт: {item.seller.accountAgeDays} дн.</p>
                    <p>Объявлений: {item.seller.listingCount}</p>
                    <p>Email: {item.seller.emailVerified ? 'подтверждён' : 'не подтверждён'}</p>
                  </div>

                  {reasons.length > 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <p className="mb-2 text-sm font-medium">AI: сигналы для проверки</p>
                      <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
                        {reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {item.duplicateHints.length > 0 ? (
                    <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
                      {item.duplicateHints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor={`reject-${item.id}`}>Причина отклонения</Label>
                    <textarea
                      id={`reject-${item.id}`}
                      className="border-border bg-card min-h-20 w-full rounded-xl border px-3 py-2 text-sm"
                      placeholder="Например: цена не соответствует описанию, нужны дополнительные фото"
                      value={rejectNote}
                      onChange={(e) =>
                        setRejectNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => approve.mutate(item.id)}
                      >
                        Одобрить
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={approve.isPending || reject.isPending || rejectNote.trim().length < 3}
                        onClick={() => reject.mutate({ id: item.id, note: rejectNote.trim() })}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
