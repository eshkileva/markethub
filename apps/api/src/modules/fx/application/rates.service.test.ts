import { describe, expect, it } from 'vitest';
import { ratesFromPerRubQuotes } from './rates.service.js';

describe('ratesFromPerRubQuotes', () => {
  it('stores RUB-per-unit from BYN/KZT-per-RUB quotes', () => {
    const rates = ratesFromPerRubQuotes(0.035577, 5.234374);
    expect(rates.RUB).toBe(1);
    expect(rates.BYN).toBeCloseTo(1 / 0.035577, 5);
    expect(rates.KZT).toBeCloseTo(1 / 5.234374, 5);
  });

  it('rejects missing quotes', () => {
    expect(() => ratesFromPerRubQuotes(0, 5)).toThrow('Incomplete FX quotes');
  });
});
