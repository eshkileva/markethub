export type ComboboxOption = {
  value: string;
  label: string;
};

export function filterComboboxOptions(options: ComboboxOption[], query: string) {
  const needle = query.trim().toLocaleLowerCase('ru-RU');
  if (!needle) return options;
  return options.filter((item) => item.label.toLocaleLowerCase('ru-RU').includes(needle));
}

