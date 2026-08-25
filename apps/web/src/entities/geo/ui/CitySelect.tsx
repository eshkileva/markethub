import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CountryCode } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { NativeSelect } from '@/shared/ui/native-select';

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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const query = useQuery({
    queryKey: ['geo-cities', country],
    enabled: Boolean(country),
    queryFn: () => apiRequest<CitiesResponse>(`/v1/geo/cities?country=${country}`),
  });

  const cities = query.data?.items ?? [];
  const ready = Boolean(country) && query.isSuccess;

  useEffect(() => {
    if (!ready) return;
    const known = cities.some((city) => city.nameRu === value);
    if (value && !known) {
      onChangeRef.current(allowEmpty ? '' : (cities[0]?.nameRu ?? ''));
      return;
    }
    if (!value && !allowEmpty && cities[0]) {
      onChangeRef.current(cities[0].nameRu);
    }
  }, [allowEmpty, cities, ready, value]);

  return (
    <NativeSelect
      id={id}
      value={value}
      disabled={disabled || !country}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Город"
    >
      {allowEmpty ? (
        <option value="">{country ? emptyLabel : 'Сначала выберите страну'}</option>
      ) : null}
      {!allowEmpty && !country ? <option value="">Сначала выберите страну</option> : null}
      {cities.map((city) => (
        <option key={city.nameRu} value={city.nameRu}>
          {city.nameRu}
        </option>
      ))}
    </NativeSelect>
  );
}
