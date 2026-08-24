import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Package } from 'lucide-react';
import type { CurrencyCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { ProductCard } from '@/entities/listing/ui/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

type ListingsResponse = {
  items: Array<{
    id: string;
    title: string;
    price: number;
    currency: CurrencyCode;
    city: string;
    country: string;
    imageUrl: string | null;
    publishedAt: string | null;
    isFavorite?: boolean;
  }>;
};

type CategoriesResponse = {
  items: Array<{ id: string; slug: string; nameRu: string; icon: string | null }>;
};

export function HomePage() {
  const countryFilter = useUiStore((s) => s.countryFilter);
  const token = useAuthStore((s) => s.accessToken);

  const listingsQuery = useQuery({
    queryKey: ['listings', countryFilter, token],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '12' });
      if (countryFilter !== 'ALL') params.set('country', countryFilter);
      return apiRequest<ListingsResponse>(`/v1/listings?${params}`, { token });
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<CategoriesResponse>('/v1/categories'),
  });

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary">BY · RU · KZ</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Покупайте и продавайте по всему СНГ
            </h1>
            <p className="text-muted max-w-xl">
              Один аккаунт — объявления в разных странах, цены с конвертацией валют и доверием к
              продавцу на первом плане.
            </p>
          </div>
          <div className="relative hidden min-h-44 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 md:block">
            <div className="absolute inset-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm" />
            <div className="absolute bottom-8 left-8 right-8 rounded-xl bg-white/95 p-4 shadow-lg">
              <div className="text-muted text-xs">Пример цены</div>
              <div className="text-xl font-semibold tabular-nums">64 000 ₽</div>
              <div className="text-muted text-xs">≈ 2 245 Br · 355 555 ₸</div>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Популярные категории</h2>
          <Link to="/catalog" className="text-primary text-sm">
            Все объявления
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {(categoriesQuery.data?.items ?? []).map((category) => (
            <Link
              key={category.id}
              to="/catalog"
              search={{ category: category.slug }}
              className="border-border bg-card flex min-w-28 flex-col items-center gap-2 rounded-2xl border px-4 py-3 shadow-sm"
            >
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{category.nameRu}</span>
            </Link>
          ))}
          {categoriesQuery.isLoading ? (
            <div className="text-muted text-sm">Загрузка категорий…</div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Рекомендуемые объявления</h2>
            <p className="text-muted text-sm">Свежие публикации по выбранному региону</p>
          </div>
          <Link to="/catalog" className="text-primary text-sm">
            Каталог
          </Link>
        </div>

        {listingsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-72 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : null}

        {listingsQuery.data?.items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Пока нет объявлений</CardTitle>
            </CardHeader>
            <CardContent className="text-muted text-sm">
              В этом регионе пока нет объявлений. Снимите фильтр страны в шапке или{' '}
              <Link to="/listings/create" className="text-primary">
                разместите первое
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {listingsQuery.data?.items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
