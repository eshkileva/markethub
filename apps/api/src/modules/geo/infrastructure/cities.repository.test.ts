import { describe, expect, it } from 'vitest';
import { allCities } from '@markethub/shared';

describe('cities repository contract', () => {
  it('seed dictionary includes Omsk for server-side q= search', () => {
    expect(allCities().some((city) => city.country === 'RU' && city.nameRu === 'Омск')).toBe(true);
  });

  it('has more than combobox cap for RU to require q search', () => {
    const ruCount = allCities().filter((city) => city.country === 'RU').length;
    expect(ruCount).toBeGreaterThan(50);
  });
});
