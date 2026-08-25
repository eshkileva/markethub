export const COUNTRIES = [
  {
    code: 'BY',
    nameRu: 'Беларусь',
    nameEn: 'Belarus',
    phonePrefix: '+375',
    defaultCurrency: 'BYN',
    defaultCity: 'Минск',
  },
  {
    code: 'RU',
    nameRu: 'Россия',
    nameEn: 'Russia',
    phonePrefix: '+7',
    defaultCurrency: 'RUB',
    defaultCity: 'Москва',
  },
  {
    code: 'KZ',
    nameRu: 'Казахстан',
    nameEn: 'Kazakhstan',
    phonePrefix: '+7',
    defaultCurrency: 'KZT',
    defaultCity: 'Астана',
  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRY_CODES.includes(value as CountryCode);
}

export function getCountry(code: CountryCode) {
  const country = COUNTRIES.find((item) => item.code === code);
  if (!country) {
    throw new Error(`Unknown country: ${code}`);
  }
  return country;
}

export function defaultCityForCountry(code: CountryCode): string {
  return getCountry(code).defaultCity;
}

export function countryName(code: string): string {
  const country = COUNTRIES.find((item) => item.code === code);
  return country?.nameRu ?? code;
}
