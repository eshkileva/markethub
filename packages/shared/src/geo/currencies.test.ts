import { convertAmount } from '../geo/currencies.js';

describe('convertAmount', () => {
  it('returns the same amount for identical currencies', () => {
    expect(convertAmount(100, 'RUB', 'RUB')).toBe(100);
  });

  it('converts RUB to BYN using demo rates', () => {
    const byn = convertAmount(2850, 'RUB', 'BYN');
    expect(byn).toBeCloseTo(100);
  });
});
