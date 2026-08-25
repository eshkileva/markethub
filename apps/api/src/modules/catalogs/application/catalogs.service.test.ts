import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../../shared/errors/app-error.js';
import { CatalogsService, parseKind } from './catalogs.service.js';

describe('parseKind', () => {
  it('accepts a leaf slug', () => {
    expect(parseKind('cars')).toBe('cars');
    expect(parseKind('moto')).toBe('moto');
  });

  it('rejects the old shared auto/phone/computer kinds', () => {
    expect(() => parseKind('auto')).toThrow(ValidationError);
    expect(() => parseKind('phone')).toThrow(ValidationError);
    expect(() => parseKind('computer')).toThrow(ValidationError);
  });
});

describe('CatalogsService HTTP reads', () => {
  it('listBrands does not call MobileAPI', async () => {
    const repo = {
      listBrands: vi.fn(async () => [{ key: 'APPLE', name: 'Apple', nameRu: null }]),
    };
    const service = new CatalogsService(repo as never);
    const result = await service.listBrands('smartphones');
    expect(result.items).toEqual([{ key: 'APPLE', name: 'Apple', nameRu: null }]);
    expect(repo.listBrands).toHaveBeenCalledWith('smartphones', undefined);
  });

  it('listModels does not call MobileAPI', async () => {
    const repo = {
      findBrand: vi.fn(async () => ({ id: 'brand-1', name: 'Apple' })),
      listModels: vi.fn(async () => [{ key: '1', name: 'iPhone 15', nameRu: null }]),
    };
    const service = new CatalogsService(repo as never);
    const result = await service.listModels('smartphones', 'Apple');
    expect(result.items[0]?.name).toBe('iPhone 15');
    expect(repo.findBrand).toHaveBeenCalledWith('smartphones', 'Apple');
  });
});
