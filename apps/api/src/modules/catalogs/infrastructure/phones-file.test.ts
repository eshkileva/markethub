import { describe, expect, it } from 'vitest';
import { loadPhonesFile, loadTabletsFile } from './phones-file.js';

describe('owned catalog JSON files', () => {
  it('phones.json has at least 50 brands with models', async () => {
    const brands = await loadPhonesFile();
    expect(brands.length).toBeGreaterThanOrEqual(50);
    expect(brands.every((brand) => brand.id && brand.name && brand.models?.length)).toBe(true);
    const modelCount = brands.reduce((sum, brand) => sum + (brand.models?.length ?? 0), 0);
    expect(modelCount).toBeGreaterThanOrEqual(200);
  });

  it('tablets.json has a practical starter set', async () => {
    const brands = await loadTabletsFile();
    expect(brands.length).toBeGreaterThanOrEqual(15);
    expect(brands.some((brand) => brand.name === 'Apple')).toBe(true);
    expect(brands.some((brand) => brand.name === 'Samsung')).toBe(true);
  });
});
