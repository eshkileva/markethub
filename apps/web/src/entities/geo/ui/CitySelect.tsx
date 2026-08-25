import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MAX_COMBOBOX_VISIBLE } from '@markethub/shared/limits';
import type { CountryCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Combobox } from '@/shared/ui/combobox';

type CitiesResponse = {
  items: Array<{ nameRu: string; country: CountryCode }>;
};

export function CitySelect({
  id,
  country,
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = 'Любой город',
  disabled,
}: {
  id?: string;
  country: CountryCode | undefined;
  value: string;
  onChange: (city: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 250);

  const citiesQuery = useQuery({
    queryKey: ['geo-cities', country, debouncedQuery],
    enabled: Boolean(country),
    queryFn: () => {
      const params = new URLSearchParams({ country: country! });
      const trimmed = debouncedQuery.trim();
      if (trimmed) params.set('q', trimmed);
      return apiRequest<CitiesResponse>(`/v1/geo/cities?${params.toString()}`);
    },
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    const items = (citiesQuery.data?.items ?? []).map((city) => ({
      value: city.nameRu,
      label: city.nameRu,
    }));
    if (value && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: value });
    }
    return items;
  }, [citiesQuery.data?.items, value]);

  const loading = Boolean(country) && citiesQuery.isLoading;
  const errored = Boolean(country) && citiesQuery.isError;
  const showMoreHint =
    !debouncedQuery.trim() && (citiesQuery.data?.items.length ?? 0) >= MAX_COMBOBOX_VISIBLE;

  return (
    <Combobox
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled || !country || loading}
      allowEmpty={allowEmpty}
      clearLabel={country ? emptyLabel : 'Сначала выберите страну'}
      placeholder={
        !country
          ? 'Сначала выберите страну'
          : loading
            ? 'Загрузка…'
            : errored
              ? 'Ошибка загрузки'
              : 'Город'
      }
      emptyLabel={errored ? 'Не удалось загрузить города' : 'Город не найден'}
      maxVisibleOptions={MAX_COMBOBOX_VISIBLE}
      showMoreHint={showMoreHint}
      truncatedHint="Продолжайте вводить название"
      onQueryChange={setSearchQuery}
    />
  );
}
