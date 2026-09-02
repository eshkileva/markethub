import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ShieldCheck } from 'lucide-react';
import { COUNTRIES, SITE_NAME, type CountryCode } from '@markethub/shared';
import { SeoHead } from '@/shared/lib/seo-head';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ProductCard, type ProductCardData } from '@/entities/listing/ui/ProductCard';
import type { Paginated } from '@/entities/listing/model/types';
import { ReviewList, type ReviewItem } from '@/entities/review/ui/ReviewList';
import { StarRating } from '@/entities/review/ui/StarRating';
import { ReportForm } from '@/features/reports/ui/ReportForm';
import { VerifySellerButton } from '@/features/users/ui/VerifySellerButton';

type ProfileUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string;
  city: string | null;
  trustScore: number;
  isVerified: boolean;
  createdAt: string;
};

type ReviewsResponse = {
  average: number | null;
  count: number;
  trustScore: number;
  items: ReviewItem[];
};

type ListingsResponse = Paginated<ProductCardData>;

function countryName(code: string) {
  return COUNTRIES.find((item) => item.code === (code as CountryCode))?.nameRu ?? code;
}

function reviewCountLabel(count: number) {
  const n10 = count % 10;
  const n100 = count % 100;
  if (n10 === 1 && n100 !== 11) return `${count} отзыв`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${count} отзыва`;
  return `${count} отзывов`;
}

export function ProfilePage({ username }: { username: string }) {
  const token = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: () => apiRequest<ProfileUser>(`/v1/users/${encodeURIComponent(username)}`),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', profileQuery.data?.id],
    enabled: Boolean(profileQuery.data?.id),
    queryFn: () =>
      apiRequest<ReviewsResponse>(`/v1/reviews/users/${profileQuery.data!.id}?pageSize=20`),
  });

  const listingsQuery = useQuery({
    queryKey: ['listings', 'profile', profileQuery.data?.id, token],
    enabled: Boolean(profileQuery.data?.id),
    queryFn: () =>
      apiRequest<ListingsResponse>(
        `/v1/listings?sellerId=${profileQuery.data!.id}&pageSize=12&sort=newest`,
        { token },
      ),
  });

  if (profileQuery.isLoading) {
    return <Card className="h-64 animate-pulse bg-slate-100" />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Пользователь не найден</CardTitle>
        </CardHeader>
        <CardContent className="text-muted text-sm">
          Проверьте ссылку или вернитесь в{' '}
          <Link to="/catalog" className="text-primary">
            каталог
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const user = profileQuery.data;
  const name = user.displayName ?? user.username;
  const reviews = reviewsQuery.data;

  return (
    <div className="space-y-6">
      <SeoHead
        title={`${name} — продавец на ${SITE_NAME}`}
        description={`Профиль ${name} на Купилко.`}
        noindex
      />
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-lg">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
              {user.isVerified ? (
                <Badge className="bg-success/10 text-success">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Проверен
                </Badge>
              ) : null}
              <VerifySellerButton user={user} />
            </div>
            <p className="text-muted text-sm">@{user.username}</p>
            <div className="text-muted flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              {[user.city, countryName(user.country)].filter(Boolean).join(', ')}
            </div>
            {user.bio ? <p className="max-w-2xl text-sm leading-relaxed">{user.bio}</p> : null}
            {token && currentUser?.id !== user.id ? <ReportForm userId={user.id} /> : null}
          </div>
          <div className="border-border bg-background shrink-0 rounded-2xl border px-5 py-4 text-center">
            <div className="text-muted text-xs font-medium uppercase tracking-wide">
              Trust Score
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{user.trustScore}</div>
            <div className="mt-2 flex flex-col items-center gap-1">
              <StarRating value={reviews?.average ?? 0} />
              <div className="text-muted text-xs">
                {reviews?.average != null
                  ? `${reviews.average.toFixed(1)} · ${reviewCountLabel(reviews.count)}`
                  : 'Пока нет отзывов'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Отзывы</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsQuery.isLoading ? (
              <p className="text-muted text-sm">Загружаем отзывы…</p>
            ) : (
              <ReviewList items={reviews?.items ?? []} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Объявления</h2>
          {listingsQuery.data?.items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {listingsQuery.data.items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-muted p-6 text-sm">
                Нет опубликованных объявлений.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
