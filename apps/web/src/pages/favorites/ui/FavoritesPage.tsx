import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ListingCard, Paginated } from '@/entities/listing/model/types';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ProductCard } from '@/entities/listing/ui/ProductCard';
import { AiPagePitch } from '@/features/ai/ui/AiPagePitch';

type FavoritesResponse = Paginated<ListingCard>;

export function FavoritesPage() {
  const token = useAuthStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: ['favorites', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<FavoritesResponse>('/v1/favorites', { token }),
  });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Избранное</CardTitle>
        </CardHeader>
        <CardContent className="text-muted space-y-3 text-sm">
          <p>Войдите, чтобы сохранять объявления и открывать их с любого устройства.</p>
          <Button asChild>
            <Link to="/auth">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AiPagePitch page="favorites" compact />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Избранное</h1>
        <p className="text-muted text-sm">{query.data?.items.length ?? 0} сохранённых объявлений</p>
      </div>
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-72 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : null}
      {query.data?.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted p-6 text-sm">
            Пока пусто. Нажмите сердце на карточке в{' '}
            <Link to="/catalog" className="text-primary">
              каталоге
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {query.data?.items.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
