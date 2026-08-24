import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReviewSchema } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { StarRating, StarRatingInput } from '@/entities/review/ui/StarRating';

type Eligibility = {
  canReview: boolean;
  reason: 'ok' | 'not_found' | 'own_listing' | 'no_conversation' | 'already_reviewed';
  myReview: { id: string; rating: number; comment: string | null; createdAt: string } | null;
};

export function LeaveReviewCard({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOwn = user?.id === sellerId;
  const query = useQuery({
    queryKey: ['review-eligibility', listingId, token],
    enabled: Boolean(token) && !isOwn,
    queryFn: () => apiRequest<Eligibility>(`/v1/reviews/listing/${listingId}`, { token }),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = createReviewSchema.safeParse({
        listingId,
        rating,
        comment: comment.trim() || undefined,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Проверьте форму');
      }
      return apiRequest('/v1/reviews', { method: 'POST', token, body: parsed.data });
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['review-eligibility', listingId] }),
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['listing', listingId] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Не удалось отправить отзыв');
    },
  });

  if (!token || isOwn) {
    return null;
  }

  const eligibility = query.data;
  const myReview = eligibility?.myReview;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отзыв о продавце</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-muted text-sm">Проверяем, можно ли оставить отзыв…</p>
        ) : null}
        {query.isError ? (
          <p className="text-muted text-sm">Не удалось проверить отзыв. Обновите страницу.</p>
        ) : null}
        {myReview ? (
          <div className="space-y-2">
            <p className="text-muted text-sm">Вы уже оставили отзыв.</p>
            <StarRating value={myReview.rating} />
            {myReview.comment ? <p className="text-sm">{myReview.comment}</p> : null}
          </div>
        ) : null}
        {eligibility?.reason === 'no_conversation' ? (
          <p className="text-muted text-sm">
            Напишите продавцу и дождитесь переписки — после этого можно оставить отзыв.
          </p>
        ) : null}
        {eligibility?.canReview ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              submit.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label>Оценка</Label>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-comment">Комментарий</Label>
              <Textarea
                id="review-comment"
                value={comment}
                maxLength={1000}
                placeholder="Как прошла сделка: общение, товар, встреча"
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            {error ? <p className="text-danger text-sm">{error}</p> : null}
            <Button type="submit" disabled={submit.isPending}>
              Опубликовать отзыв
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
