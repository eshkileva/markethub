export const CURRENCIES = [
  { code: 'BYN', nameRu: 'Белорусский рубль', symbol: 'Br' },
  { code: 'RUB', nameRu: 'Российский рубль', symbol: '₽' },
  { code: 'KZT', nameRu: 'Казахстанский тенге', symbol: '₸' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODES.includes(value as CurrencyCode);
}

/**
 * Seed FX table quoted against RUB. Replace with a rates service later.
 * 1 unit of `code` = `toRub` RUB.
 */
export const DEMO_RATES_TO_RUB: Record<CurrencyCode, number> = {
  RUB: 1,
  BYN: 28.5,
  KZT: 0.18,
};

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<CurrencyCode, number> = DEMO_RATES_TO_RUB,
): number {
  if (from === to) return amount;
  const inRub = amount * rates[from];
  return inRub / rates[to];
}

export function formatMoney(amount: number, currency: CurrencyCode, locale = 'ru-RU'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
