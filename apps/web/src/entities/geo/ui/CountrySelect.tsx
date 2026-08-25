import { useMemo } from 'react';
import { COUNTRIES, type CountryCode } from '@markethub/shared';
import { Combobox } from '@/shared/ui/combobox';

export function CountrySelect({
  id,
  value,
  onChange,
  allowEmpty = false,
  clearLabel = 'Не выбрано',
  disabled,
  onCountryChange,
}: {
  id?: string;
  value: CountryCode | '';
  onChange: (country: CountryCode | '') => void;
  allowEmpty?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  onCountryChange?: (country: CountryCode | '') => void;
}) {
  const options = useMemo(
    () =>
      COUNTRIES.map((item) => ({
        value: item.code,
        label: item.nameRu,
      })),
    [],
  );

  return (
    <Combobox
      id={id}
      value={value}
      onChange={(next) => {
        onChange(next as CountryCode | '');
        onCountryChange?.(next as CountryCode | '');
      }}
      options={options}
      disabled={disabled}
      allowEmpty={allowEmpty}
      clearLabel={clearLabel}
      placeholder="Страна"
      emptyLabel="Страна не найдена"
    />
  );
}
