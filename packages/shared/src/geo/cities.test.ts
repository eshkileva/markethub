import { defaultCityForCountry, isCityInCountry, listCities } from './cities.js';

describe('listCities', () => {
  it('returns country cities and filters by query', () => {
    expect(listCities('BY').some((city) => city.nameRu === 'Минск')).toBe(true);
    expect(listCities('RU', 'моск').map((city) => city.nameRu)).toEqual(['Москва']);
    expect(listCities('KZ', 'алм').map((city) => city.nameRu)).toEqual(['Алматы']);
  });
});

describe('isCityInCountry', () => {
  it('accepts known cities and rejects others', () => {
    expect(isCityInCountry('RU', 'Казань')).toBe(true);
    expect(isCityInCountry('BY', 'Казань')).toBe(false);
    expect(defaultCityForCountry('KZ')).toBe('Астана');
  });
});
