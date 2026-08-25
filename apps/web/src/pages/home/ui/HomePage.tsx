import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Search } from 'lucide-react';
import type { CurrencyCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { ProductCard } from '@/entities/listing/ui/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { categoryIcons } from '@/entities/category/model/icons';

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
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

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
      <section className="border-border bg-card relative overflow-hidden rounded-[1.75rem] border shadow-sm">
        <div
          className="bg-primary/15 pointer-events-none absolute -right-8 -top-10 h-48 w-48 rotate-12 rounded-[2rem]"
          aria-hidden
        />
        <div
          className="bg-accent/20 pointer-events-none absolute bottom-6 right-16 h-24 w-24 -rotate-6 rounded-3xl"
          aria-hidden
        />
        <div className="relative grid gap-8 p-6 md:grid-cols-[1.3fr_0.9fr] md:p-8">
          <div className="space-y-5">
            <Badge className="bg-primary/10 text-primary">BY · RU · KZ</Badge>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Купилко — вещи рядом
              <span className="text-primary"> и через границу</span>
            </h1>
            <p className="text-muted max-w-xl text-base">
              Один аккаунт для Беларуси, России и Казахстана. Цены с конвертацией, город из списка
              страны и доверие к продавцу на виду.
            </p>
            <form
              className="flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void navigate({
                  to: '/catalog',
                  search: { q: query.trim() || undefined },
                });
              }}
            >
              <div className="relative min-w-0 flex-1">
                <Search className="text-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  className="h-12 rounded-2xl pl-10"
                  placeholder="iPhone, диван, велосипед..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Найти
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <div className="border-border bg-background/80 hidden rounded-[1.5rem] border p-5 md:block">
            <div className="text-muted text-xs font-medium uppercase tracking-wider">
              Пример цены
            </div>
            <div className="font-display mt-2 text-3xl font-semibold tabular-nums">64 000 ₽</div>
            <div className="text-muted mt-1 text-sm">≈ 2 245 Br · 355 555 ₸</div>
            <p className="text-muted mt-4 text-sm">
              Объявление из Москвы видно в Минске и Алматы с пересчётом в местную валюту.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Категории</h2>
          <Link to="/catalog" className="text-primary text-sm">
            Все объявления
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {(categoriesQuery.data?.items ?? []).map((category) => {
            const Icon = categoryIcons[category.slug];
            return (
              <Link
                key={category.id}
                to="/catalog"
                search={{ category: category.slug }}
                className="border-border bg-card hover:border-primary/40 flex min-w-28 flex-col items-center gap-2 rounded-2xl border px-4 py-3 shadow-sm transition-colors duration-200"
              >
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </div>
                <span className="text-xs font-medium">{category.nameRu}</span>
              </Link>
            );
          })}
          {categoriesQuery.isLoading ? (
            <div className="text-muted text-sm">Загрузка категорий…</div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Свежие объявления</h2>
            <p className="text-muted text-sm">По выбранному региону в шапке</p>
          </div>
          <Link to="/catalog" className="text-primary text-sm">
            Каталог
          </Link>
        </div>

        {listingsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-primary/5 h-72 animate-pulse" />
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
