import { allCities, cityCounts } from './cities.js';
import { defaultCityForCountry } from './countries.js';

describe('city seed dictionary', () => {
  it('contains official city counts per country', () => {
    expect(cityCounts()).toEqual({ BY: 115, RU: 1111, KZ: 90 });
    expect(allCities()).toHaveLength(1316);
    expect(allCities().some((city) => city.country === 'BY' && city.nameRu === 'Бобруйск')).toBe(
      true,
    );
    expect(allCities().some((city) => city.country === 'RU' && city.nameRu === 'Омск')).toBe(true);
    expect(allCities().some((city) => city.country === 'KZ' && city.nameRu === 'Балхаш')).toBe(
      true,
    );
    expect(defaultCityForCountry('KZ')).toBe('Астана');
  });
});
