/**
 * Owned city dictionary for Postgres seed (`pnpm db:seed`).
 * Runtime listing/geo flows read from the `cities` table via GeoService.
 */
import type { CountryCode } from './countries.js';
import byCities from './by-cities.json' with { type: 'json' };
import kzCities from './kz-cities.json' with { type: 'json' };
import ruCities from './ru-cities.json' with { type: 'json' };

export type City = {
  nameRu: string;
  country: CountryCode;
};

const CITIES_BY_COUNTRY: Record<CountryCode, readonly string[]> = {
  BY: byCities as readonly string[],
  RU: ruCities as readonly string[],
  KZ: kzCities as readonly string[],
};

export function cityCounts(): Record<CountryCode, number> {
  return {
    BY: CITIES_BY_COUNTRY.BY.length,
    RU: CITIES_BY_COUNTRY.RU.length,
    KZ: CITIES_BY_COUNTRY.KZ.length,
  };
}

export function allCities(): City[] {
  return (Object.keys(CITIES_BY_COUNTRY) as CountryCode[]).flatMap((country) =>
    CITIES_BY_COUNTRY[country].map((nameRu) => ({ nameRu, country })),
  );
}
