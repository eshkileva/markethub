import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Search } from 'lucide-react';
import type { ConvertedAmounts, CurrencyCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { ProductCard } from '@/entities/listing/ui/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { categoryIcons } from '@/entities/category/model/icons';
import { categoryRoots } from '@/entities/category/model/tree';
import { resolveSmartSearch } from '@/features/search/model/resolve-smart-search';
import { AiFeaturesShowcase } from '@/features/ai/ui/AiPagePitch';
import { AiPlatformBadge } from '@/features/ai/ui/AiPlatformBadge';
import { useAiStatus } from '@/features/ai/model/use-ai-status';
import { AI_HERO_HEADLINE, AI_PLATFORM_TAGLINE } from '@/features/ai/model/ai-messaging';
import { AuthGuestBanner } from '@/features/auth/ui/AuthGuestBanner';

type ListingsResponse = {
  items: Array<{
    id: string;
    title: string;
    price: number;
    currency: CurrencyCode;
    converted?: ConvertedAmounts;
    city: string;
    country: string;
    imageUrl: string | null;
    publishedAt: string | null;
    isFavorite?: boolean;
  }>;
};

type CategoriesResponse = {
  items: Array<{
    id: string;
    slug: string;
    nameRu: string;
    icon: string | null;
    parentId: string | null;
  }>;
};

export function HomePage() {
  const countryFilter = useUiStore((s) => s.countryFilter);
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const aiStatus = useAiStatus();

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
      <AuthGuestBanner />
      <section className="border-border bg-card relative overflow-hidden rounded-[1.25rem] border shadow-sm">
        <div className="from-primary/15 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />
        <div className="relative space-y-4 p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary">BY · RU · KZ</Badge>
            <AiPlatformBadge live={aiStatus.data?.enabled} />
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            {AI_HERO_HEADLINE}
            <span className="text-primary block text-xl sm:text-2xl md:text-3xl">
              {AI_PLATFORM_TAGLINE}
            </span>
          </h1>
          <p className="text-muted max-w-2xl text-sm sm:text-base">
            Умный поиск, copilot для продавцов, Trust Score на карточках и AI-подсказки в чате — всё
            уже работает на платформе, а не «где-то сбоку».
          </p>
          <form
            className="flex max-w-xl flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = query.trim();
              if (!trimmed) {
                void navigate({ to: '/catalog' });
                return;
              }
              void resolveSmartSearch(trimmed, {
                country: countryFilter === 'ALL' ? undefined : countryFilter,
              }, token).then((search) => navigate({ to: '/catalog', search }));
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                className="h-12 rounded-2xl pl-10"
                placeholder="AI-поиск: ноутбук до 50000 в Минске..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              AI-поиск
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      <AiFeaturesShowcase />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Категории</h2>
          <Link to="/catalog" className="text-primary text-sm">
            Все объявления
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {(categoryRoots(categoriesQuery.data?.items ?? [])).map((category) => {
            const Icon = categoryIcons[category.slug];
            return (
              <Link
                key={category.id}
                to="/catalog"
                search={{ category: category.slug }}
                className="border-border bg-card hover:border-primary/40 flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border px-3 py-3 shadow-sm transition-colors duration-200"
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
            <p className="text-muted text-sm">Trust Score и вердикт цены — на карточках с AI-оценкой</p>
          </div>
          <Link to="/catalog" className="text-primary text-sm">
            Каталог
          </Link>
        </div>

        {listingsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-surface-secondary h-72 animate-pulse" />
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
