import { useMemo } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List } from 'lucide-react';
import {
  COUNTRIES,
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
import { NativeSelect } from '@/shared/ui/native-select';
import { ProductCard, type ProductCardData } from '@/entities/listing/ui/ProductCard';
import { deliveryModeLabels, listingConditionLabels } from '@/entities/listing/model/labels';
import { CitySelect } from '@/entities/geo/ui/CitySelect';
import type { AttributeDef } from '@/pages/create-listing/ui/ListingAttributesFields';
import type { CatalogSearch } from '@/pages/catalog/model/search';

type ListingsResponse = {
  items: Array<ProductCardData>;
  page: number;
  pageSize: number;
  total: number;
};

type CategoriesResponse = {
  items: Array<{ id: string; slug: string; nameRu: string }>;
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
  const country = search.country ?? (countryFilter === 'ALL' ? undefined : countryFilter);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<CategoriesResponse>('/v1/categories'),
  });

  const categoryId = useMemo(() => {
    if (!search.category) return undefined;
    return categoriesQuery.data?.items.find((item) => item.slug === search.category)?.id;
  }, [categoriesQuery.data, search.category]);

  const attributesQuery = useQuery({
    queryKey: ['category-attributes', categoryId],
    enabled: Boolean(categoryId),
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

  function patchAttr(key: string, value: string) {
    const current = (search.attr ?? []).filter((item) => !item.startsWith(`${key}:`));
    if (value) current.push(`${key}:${value}`);
    patchSearch({ attr: current.length ? current : undefined });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
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
              placeholder="iPhone, RTX, диван..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catalog-category">Категория</Label>
            <NativeSelect
              id="catalog-category"
              value={search.category ?? ''}
              onChange={(e) =>
                patchSearch({ category: e.target.value || undefined, attr: undefined })
              }
            >
              <option value="">Все категории</option>
              {(categoriesQuery.data?.items ?? []).map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.nameRu}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catalog-country">Страна</Label>
            <NativeSelect
              id="catalog-country"
              value={country ?? ''}
              onChange={(e) =>
                patchSearch({
                  country: (e.target.value || undefined) as CountryCode | undefined,
                  city: undefined,
                })
              }
            >
              <option value="">Весь СНГ</option>
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nameRu}
                </option>
              ))}
            </NativeSelect>
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
            <NativeSelect
              id="catalog-currency"
              value={search.currency ?? ''}
              onChange={(e) =>
                patchSearch({
                  currency: (e.target.value || undefined) as CurrencyCode | undefined,
                })
              }
            >
              <option value="">Любая</option>
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catalog-condition">Состояние</Label>
            <NativeSelect
              id="catalog-condition"
              value={search.condition ?? ''}
              onChange={(e) =>
                patchSearch({
                  condition: (e.target.value || undefined) as ListingCondition | undefined,
                })
              }
            >
              <option value="">Любое</option>
              {LISTING_CONDITIONS.map((item) => (
                <option key={item} value={item}>
                  {listingConditionLabels[item]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catalog-delivery">Доставка</Label>
            <NativeSelect
              id="catalog-delivery"
              value={search.delivery ?? ''}
              onChange={(e) =>
                patchSearch({
                  delivery: (e.target.value || undefined) as DeliveryMode | undefined,
                })
              }
            >
              <option value="">Любая</option>
              {DELIVERY_MODES.map((item) => (
                <option key={item} value={item}>
                  {deliveryModeLabels[item]}
                </option>
              ))}
            </NativeSelect>
          </div>
          {categoryId && (attributesQuery.data?.items.length ?? 0) > 0 ? (
            <div className="border-border space-y-3 border-t pt-3">
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">
                Характеристики
              </p>
              {attributesQuery.data?.items.map((attr) => (
                <div key={attr.id} className="space-y-1.5">
                  <Label htmlFor={`attr-${attr.key}`}>{attr.labelRu}</Label>
                  {attr.type === 'enum' && attr.options ? (
                    <NativeSelect
                      id={`attr-${attr.key}`}
                      value={attrValue(search.attr, attr.key)}
                      onChange={(e) => patchAttr(attr.key, e.target.value)}
                    >
                      <option value="">Любое</option>
                      {attr.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : (
                    <Input
                      id={`attr-${attr.key}`}
                      value={attrValue(search.attr, attr.key)}
                      onChange={(e) => patchAttr(attr.key, e.target.value)}
                      placeholder={attr.type === 'number' ? 'Число' : undefined}
                    />
                  )}
                </div>
              ))}
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Каталог</h1>
            <p className="text-muted text-sm">{total} объявлений</p>
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect
              className="w-auto"
              value={search.sort ?? 'newest'}
              onChange={(e) =>
                patchSearch({
                  sort: e.target.value as 'newest' | 'price_asc' | 'price_desc',
                })
              }
              aria-label="Сортировка"
            >
              <option value="newest">Сначала новые</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
            </NativeSelect>
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
              <Card key={i} className="h-72 animate-pulse bg-slate-100" />
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
  );
}
