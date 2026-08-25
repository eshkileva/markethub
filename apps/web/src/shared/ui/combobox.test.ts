import { describe, expect, it } from 'vitest';
import { filterComboboxOptions } from './combobox-filter';

describe('filterComboboxOptions', () => {
  it('matches Минск when typing мин', () => {
    const options = [
      { value: 'Минск', label: 'Минск' },
      { value: 'Москва', label: 'Москва' },
      { value: 'Брест', label: 'Брест' },
    ];
    expect(filterComboboxOptions(options, 'мин').map((item) => item.label)).toEqual(['Минск']);
  });
});
