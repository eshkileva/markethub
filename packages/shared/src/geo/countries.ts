export const COUNTRIES = [
  {
    code: 'BY',
    nameRu: 'Беларусь',
    nameEn: 'Belarus',
    phonePrefix: '+375',
    defaultCurrency: 'BYN',
  },
  { code: 'RU', nameRu: 'Россия', nameEn: 'Russia', phonePrefix: '+7', defaultCurrency: 'RUB' },
  {
    code: 'KZ',
    nameRu: 'Казахстан',
    nameEn: 'Kazakhstan',
    phonePrefix: '+7',
    defaultCurrency: 'KZT',
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
