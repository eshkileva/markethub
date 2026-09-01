import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import {
  CURRENCIES,
  DELIVERY_MODES,
  LISTING_CONDITIONS,
  type CountryCode,
  type CurrencyCode,
  type DeliveryMode,
  type ListingCondition,
} from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Combobox } from '@/shared/ui/combobox';
import { ProductCard, type ProductCardData } from '@/entities/listing/ui/ProductCard';
import { deliveryModeLabels, listingConditionLabels } from '@/entities/listing/model/labels';
import { CitySelect } from '@/entities/geo/ui/CitySelect';
import { CountrySelect } from '@/entities/geo/ui/CountrySelect';
import { CategoryAttributeFields } from '@/entities/category/ui/CategoryAttributeFields';
import { categoryChildren, categoryRoots, findCategory } from '@/entities/category/model/tree';
import type { AttributeDef } from '@/pages/create-listing/ui/ListingAttributesFields';
import type { CatalogSearch } from '@/pages/catalog/model/search';
import { useSearchHistory } from '@/features/search/model/use-search-history';
import { resolveSmartSearch } from '@/features/search/model/resolve-smart-search';
import { AiPagePitch } from '@/features/ai/ui/AiPagePitch';
import { AuthGuestBanner } from '@/features/auth/ui/AuthGuestBanner';
import { normalizeSearchQuery } from '@markethub/shared';

type ListingsResponse = {
  items: Array<ProductCardData>;
  page: number;
  pageSize: number;
  total: number;
};

type CategoriesResponse = {
  items: Array<{ id: string; slug: string; nameRu: string; parentId: string | null }>;
};

type AttributesResponse = { items: AttributeDef[] };

function attrValue(attrs: string[] | undefined, key: string): string {
  const prefix = `${key}:`;
  const match = attrs?.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : '';
}

export function CatalogPage() {
  const search = useSearch({ from: '/catalog' });
  const navigate = useNavigate({ from: '/catalog' });
  const token = useAuthStore((s) => s.accessToken);
  const countryFilter = useUiStore((s) => s.countryFilter);
  const filtersOpen = useUiStore((s) => s.filtersOpen);
  const setFiltersOpen = useUiStore((s) => s.setFiltersOpen);
  const country = search.country ?? (countryFilter === 'ALL' ? undefined : countryFilter);
  const { record: recordSearchHistory } = useSearchHistory();
  const lastRecordedQuery = useRef<string | null>(null);

  useEffect(() => {
    const normalized = search.q ? normalizeSearchQuery(search.q) : null;
    if (!normalized || normalized === lastRecordedQuery.current) return;
    lastRecordedQuery.current = normalized;
    recordSearchHistory(normalized);
  }, [search.q, recordSearchHistory]);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<CategoriesResponse>('/v1/categories'),
  });
  const categoryItems = categoriesQuery.data?.items ?? [];
  const selectedCategory = findCategory(categoryItems, search.category);
  const selectedRoot = selectedCategory
    ? selectedCategory.parentId
      ? categoryItems.find((item) => item.id === selectedCategory.parentId)
      : selectedCategory
    : undefined;
  const selectedLeaf = selectedCategory?.parentId ? selectedCategory : undefined;

  const categoryId = selectedCategory?.id;

  const attributesQuery = useQuery({
    queryKey: ['category-attributes', categoryId],
    enabled: Boolean(selectedLeaf),
    queryFn: () => apiRequest<AttributesResponse>(`/v1/categories/${categoryId}/attributes`),
  });

  const listingsQuery = useQuery({
    queryKey: ['listings', 'catalog', search, country, categoryId, token],
    enabled: !search.category || Boolean(categoryId) || categoriesQuery.isSuccess,
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(search.page ?? 1));
      params.set('pageSize', '12');
      params.set('sort', search.sort ?? 'newest');
      if (search.q) params.set('q', search.q);
      if (country) params.set('country', country);
      if (search.city) params.set('city', search.city);
      if (categoryId) params.set('categoryId', categoryId);
      if (search.currency) params.set('currency', search.currency);
      if (search.minPrice !== undefined) params.set('minPrice', String(search.minPrice));
      if (search.maxPrice !== undefined) params.set('maxPrice', String(search.maxPrice));
      if (search.condition) params.set('condition', search.condition);
      if (search.delivery) params.set('delivery', search.delivery);
      for (const item of search.attr ?? []) params.append('attr', item);
      return apiRequest<ListingsResponse>(`/v1/listings?${params}`, { token });
    },
  });

  const view = search.view ?? 'grid';
  const total = listingsQuery.data?.total ?? 0;
  const page = search.page ?? 1;
  const pageCount = Math.max(1, Math.ceil(total / 12));

  function patchSearch(next: Partial<CatalogSearch>) {
    void navigate({
      search: (prev) => {
        const merged = { ...prev, ...next };
        if (!('page' in next)) merged.page = 1;
        return merged;
      },
    });
  }

  async function submitSmartSearch(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      patchSearch({ q: undefined });
      return;
    }
    const resolved = await resolveSmartSearch(trimmed, { country: country ?? undefined }, token);
    patchSearch(resolved);
  }

  function patchAttr(key: string, value: string) {
    const current = (search.attr ?? []).filter((item) => !item.startsWith(`${key}:`));
    if (value) current.push(`${key}:${value}`);
    const extra: Partial<CatalogSearch> = { attr: current.length ? current : undefined };
    if (key === 'brand') {
      extra.attr = (extra.attr ?? []).filter((item) => !item.startsWith('model:'));
    }
    patchSearch(extra);
  }

  const filters = (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Фильтры</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="catalog-q">Поиск</Label>
          <Input
            id="catalog-q"
            value={search.q ?? ''}
            onChange={(e) => patchSearch({ q: e.target.value || undefined })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submitSmartSearch(event.currentTarget.value);
              }
            }}
            placeholder="iPhone до 50000, ноутбук Минск..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalog-category">Категория</Label>
          <Combobox
            id="catalog-category"
            value={selectedRoot?.slug ?? ''}
            onChange={(value) => patchSearch({ category: value || undefined, attr: undefined })}
            allowEmpty
            clearLabel="Все категории"
            options={categoryRoots(categoryItems).map((category) => ({
              value: category.slug,
              label: category.nameRu,
            }))}
          />
        </div>
        {selectedRoot ? (
          <div className="space-y-1.5">
            <Label htmlFor="catalog-subcategory">Подкатегория</Label>
            <Combobox
              id="catalog-subcategory"
              value={selectedLeaf?.slug ?? ''}
              onChange={(value) =>
                patchSearch({ category: value || selectedRoot.slug, attr: undefined })
              }
              allowEmpty
              clearLabel="Все в категории"
              options={categoryChildren(categoryItems, selectedRoot.id).map((category) => ({
                value: category.slug,
                label: category.nameRu,
              }))}
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="catalog-country">Страна</Label>
          <CountrySelect
            id="catalog-country"
            value={country ?? ''}
            allowEmpty
            clearLabel="Весь СНГ"
            onChange={(value) =>
              patchSearch({
                country: (value || undefined) as CountryCode | undefined,
                city: undefined,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalog-city">Город</Label>
          <CitySelect
            id="catalog-city"
            country={country}
            value={search.city ?? ''}
            allowEmpty
            onChange={(city) => patchSearch({ city: city || undefined })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="min-price">Цена от</Label>
            <Input
              id="min-price"
              type="number"
              min="0"
              value={search.minPrice ?? ''}
              onChange={(e) =>
                patchSearch({
                  minPrice: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-price">до</Label>
            <Input
              id="max-price"
              type="number"
              min="0"
              value={search.maxPrice ?? ''}
              onChange={(e) =>
                patchSearch({
                  maxPrice: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalog-currency">Валюта</Label>
          <Combobox
            id="catalog-currency"
            value={search.currency ?? ''}
            onChange={(value) =>
              patchSearch({
                currency: (value || undefined) as CurrencyCode | undefined,
              })
            }
            allowEmpty
            clearLabel="Любая"
            options={CURRENCIES.map((item) => ({
              value: item.code,
              label: item.code,
            }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalog-condition">Состояние</Label>
          <Combobox
            id="catalog-condition"
            value={search.condition ?? ''}
            onChange={(value) =>
              patchSearch({
                condition: (value || undefined) as ListingCondition | undefined,
              })
            }
            allowEmpty
            clearLabel="Любое"
            options={LISTING_CONDITIONS.map((item) => ({
              value: item,
              label: listingConditionLabels[item],
            }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalog-delivery">Доставка</Label>
          <Combobox
            id="catalog-delivery"
            value={search.delivery ?? ''}
            onChange={(value) =>
              patchSearch({
                delivery: (value || undefined) as DeliveryMode | undefined,
              })
            }
            allowEmpty
            clearLabel="Любая"
            options={DELIVERY_MODES.map((item) => ({
              value: item,
              label: deliveryModeLabels[item],
            }))}
          />
        </div>
        {selectedLeaf && (attributesQuery.data?.items.length ?? 0) > 0 ? (
          <div className="border-border space-y-3 border-t pt-3">
            <p className="text-muted text-xs font-semibold uppercase tracking-wider">
              Характеристики
            </p>
            <CategoryAttributeFields
              defs={attributesQuery.data?.items ?? []}
              valueOf={(attr) => attrValue(search.attr, attr.key)}
              onChange={(attr, value) => patchAttr(attr.key, value)}
              enumClearLabel="Любое"
            />
          </div>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() =>
            void navigate({
              search: {
                view,
              },
            })
          }
        >
          Сбросить
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <AuthGuestBanner />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">{filters}</div>
        {filtersOpen ? (
          <div className="lg:hidden">
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="Закрыть фильтры"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-16 z-50 max-h-[70dvh] overflow-y-auto p-3 pb-4">
              {filters}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <AiPagePitch page="catalog" compact />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Каталог</h1>
              <p className="text-muted text-sm">{total} объявлений</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="lg:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Фильтры
              </Button>
              <Combobox
                className="w-44"
                value={search.sort ?? 'newest'}
                onChange={(value) =>
                  patchSearch({
                    sort: value as 'newest' | 'price_asc' | 'price_desc',
                  })
                }
                aria-label="Сортировка"
                options={[
                  { value: 'newest', label: 'Сначала новые' },
                  { value: 'price_asc', label: 'Дешевле' },
                  { value: 'price_desc', label: 'Дороже' },
                ]}
              />
              <Button
                type="button"
                size="icon"
                variant={view === 'grid' ? 'default' : 'secondary'}
                onClick={() => patchSearch({ view: 'grid' })}
                aria-label="Сетка"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={view === 'list' ? 'default' : 'secondary'}
                onClick={() => patchSearch({ view: 'list' })}
                aria-label="Список"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {listingsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-surface-secondary h-72 animate-pulse" />
              ))}
            </div>
          ) : null}

          {listingsQuery.data?.items.length === 0 ? (
            <Card>
              <CardContent className="text-muted p-6 text-sm">
                Ничего не нашлось. Снимите часть фильтров или{' '}
                <Link to="/listings/create" className="text-primary">
                  разместите объявление
                </Link>
                .
              </CardContent>
            </Card>
          ) : view === 'list' ? (
            <div className="space-y-3">
              {listingsQuery.data?.items.map((item) => (
                <ProductCard key={item.id} item={item} layout="list" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listingsQuery.data?.items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => patchSearch({ page: page - 1 })}
              >
                Назад
              </Button>
              <span className="text-muted text-sm">
                {page} / {pageCount}
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pageCount}
                onClick={() => patchSearch({ page: page + 1 })}
              >
                Вперёд
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
