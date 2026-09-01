import { describe, expect, it, vi } from 'vitest';
import { MAX_COMBOBOX_VISIBLE, MAX_GEO_CITIES } from '@markethub/shared/limits';
import { ValidationError } from '../../../shared/errors/app-error.js';
import { GeoService } from './geo.service.js';

describe('GeoService owned cities', () => {
  it('lists cities from the repository only', async () => {
    const cities = {
      list: vi.fn(async () => [{ nameRu: 'Минск', country: 'BY' }]),
      exists: vi.fn(),
    };
    const geo = new GeoService(cities as never);
    await expect(geo.listCities('BY')).resolves.toEqual([{ nameRu: 'Минск', country: 'BY' }]);
    expect(cities.list).toHaveBeenCalledWith('BY', undefined, MAX_COMBOBOX_VISIBLE);
  });

  it('passes search query with a higher limit', async () => {
    const cities = {
      list: vi.fn(async () => [{ nameRu: 'Омск', country: 'RU' }]),
      exists: vi.fn(),
    };
    const geo = new GeoService(cities as never);
    await expect(geo.listCities('RU', '  омск ')).resolves.toEqual([{ nameRu: 'Омск', country: 'RU' }]);
    expect(cities.list).toHaveBeenCalledWith('RU', 'омск', MAX_GEO_CITIES);
  });

  it('rejects unknown cities without HTTP', async () => {
    const cities = {
      list: vi.fn(),
      exists: vi.fn(async () => false),
    };
    const geo = new GeoService(cities as never);
    await expect(geo.assertCity('BY', 'Париж')).rejects.toBeInstanceOf(ValidationError);
  });
});
