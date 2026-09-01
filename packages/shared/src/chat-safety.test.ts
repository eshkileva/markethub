import { describe, expect, it } from 'vitest';
import { scanMessageForScam } from './chat-safety.js';

describe('scanMessageForScam', () => {
  it('flags prepayment requests', () => {
    const flags = scanMessageForScam('Скиньте предоплату 5000 на карту');
    expect(flags.some((item) => item.id === 'prepay')).toBe(true);
  });

  it('flags external links', () => {
    const flags = scanMessageForScam('Смотрите фото тут https://evil.example/item');
    expect(flags.some((item) => item.id === 'external_link')).toBe(true);
  });

  it('returns empty for normal messages', () => {
    expect(scanMessageForScam('Здравствуйте, можно посмотреть сегодня вечером?')).toEqual([]);
  });
});
