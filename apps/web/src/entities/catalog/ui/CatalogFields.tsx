import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CatalogKind } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { staticDictionaryQueryOptions } from '@/shared/api/query-options';
import { Combobox } from '@/shared/ui/combobox';

type BrandsResponse = { items: Array<{ key: string; name: string; nameRu: string | null }> };
type ModelsResponse = { items: Array<{ key: string; name: string; nameRu: string | null }> };

function labelOf(item: { name: string; nameRu: string | null }) {
  return item.nameRu && item.nameRu !== item.name ? `${item.name} · ${item.nameRu}` : item.name;
}

export function CatalogBrandField({
  id,
  kind,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  kind: CatalogKind;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const brandsQuery = useQuery({
    queryKey: ['catalog-brands', kind],
    queryFn: () => apiRequest<BrandsResponse>(`/v1/catalogs/${kind}/brands`),
    ...staticDictionaryQueryOptions,
  });

  const options = useMemo(() => {
    const items = (brandsQuery.data?.items ?? []).map((item) => ({
      value: item.name,
      label: labelOf(item),
    }));
    if (value && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: value });
    }
    return items;
  }, [brandsQuery.data?.items, value]);

  const loading = brandsQuery.isLoading;
  const errored = brandsQuery.isError;

  return (
    <Combobox
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || loading}
      allowEmpty
      placeholder={loading ? 'Загрузка…' : errored ? 'Ошибка загрузки' : 'Марка'}
      emptyLabel={errored ? 'Не удалось загрузить марки' : 'Марка не найдена'}
    />
  );
}

export function CatalogModelField({
  id,
  kind,
  brand,
  value,
  onChange,
}: {
  id?: string;
  kind: CatalogKind;
  brand: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const modelsQuery = useQuery({
    queryKey: ['catalog-models', kind, brand],
    enabled: Boolean(brand),
    queryFn: () =>
      apiRequest<ModelsResponse>(`/v1/catalogs/${kind}/models?${new URLSearchParams({ brand })}`),
    ...staticDictionaryQueryOptions,
  });

  const options = useMemo(() => {
    const items = (modelsQuery.data?.items ?? []).map((item) => ({
      value: item.name,
      label: labelOf(item),
    }));
    if (value && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: value });
    }
    return items;
  }, [modelsQuery.data?.items, value]);

  const loading = Boolean(brand) && modelsQuery.isLoading;
  const errored = Boolean(brand) && modelsQuery.isError;

  return (
    <Combobox
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      disabled={!brand || loading}
      allowEmpty
      placeholder={
        !brand ? 'Сначала выберите марку' : loading ? 'Загрузка…' : errored ? 'Ошибка загрузки' : 'Модель'
      }
      emptyLabel={errored ? 'Не удалось загрузить модели' : 'Модель не найдена'}
    />
  );
}
