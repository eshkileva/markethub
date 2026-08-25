import { convertAmount, convertedAmounts } from '../geo/currencies.js';

describe('convertAmount', () => {
  it('returns the same amount for identical currencies', () => {
    expect(convertAmount(100, 'RUB', 'RUB')).toBe(100);
  });

  it('converts RUB to BYN using demo rates', () => {
    const byn = convertAmount(2850, 'RUB', 'BYN');
    expect(byn).toBeCloseTo(100);
  });

  it('builds rounded amounts for all marketplace currencies', () => {
    expect(convertedAmounts(2850, 'RUB')).toEqual({
      RUB: 2850,
      BYN: 100,
      KZT: 15833,
    });
  });
});
