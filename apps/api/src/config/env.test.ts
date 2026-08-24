import { parseWebOrigins } from './env.js';

describe('parseWebOrigins', () => {
  it('allows the www twin of the configured origin', () => {
    expect(parseWebOrigins('https://kupilko.store')).toEqual(
      expect.arrayContaining(['https://kupilko.store', 'https://www.kupilko.store']),
    );
  });

  it('accepts a comma-separated list', () => {
    const origins = parseWebOrigins('https://kupilko.store, https://preview.example.com');
    expect(origins).toContain('https://kupilko.store');
    expect(origins).toContain('https://www.kupilko.store');
    expect(origins).toContain('https://preview.example.com');
    expect(origins).toContain('https://www.preview.example.com');
  });
});
