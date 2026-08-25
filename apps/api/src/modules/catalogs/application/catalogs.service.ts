import { isCatalogKind, type CatalogKind } from '@markethub/shared';
import { ValidationError } from '../../../shared/errors/app-error.js';
import { loadCarsFile } from '../infrastructure/cars-file.js';
import type { CatalogsRepository } from '../infrastructure/catalogs.repository.js';
import { loadPhonesFile, loadTabletsFile } from '../infrastructure/phones-file.js';
import {
  DESKTOP_FALLBACK,
  LAPTOP_FALLBACK,
  PC_PARTS_FALLBACK,
} from '../infrastructure/computer-fallback.js';
import { AUTO_PARTS_FALLBACK, TIRES_FALLBACK } from '../infrastructure/auto-parts-fallback.js';
import { MOTO_FALLBACK } from '../infrastructure/moto-fallback.js';

function slug(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '_').slice(0, 80);
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

export class CatalogsService {
  constructor(private readonly repo: CatalogsRepository) {}

  async listBrands(kind: CatalogKind, query?: string) {
    const items = await this.repo.listBrands(kind, query);
    return {
      items: items.map((item) => ({
        key: item.key,
        name: item.name,
        nameRu: item.nameRu,
      })),
    };
  }

  async listModels(kind: CatalogKind, brand: string, query?: string) {
    const row = await this.repo.findBrand(kind, brand);
    if (!row) return { items: [] as Array<{ key: string; name: string; nameRu: string | null }> };
    const items = await this.repo.listModels(row.id, query);
    return {
      items: items.map((item) => ({
        key: item.key,
        name: item.name,
        nameRu: item.nameRu,
      })),
    };
  }

  async migrateLegacyKinds() {
    await this.repo.rekeyKind('auto', 'cars');
    await this.repo.rekeyKind('phone', 'smartphones');
    await this.repo.deleteBrandsByKind('computer');
  }

  async seedAllIfEmpty() {
    await this.seedIfEmpty('cars', () => this.seedCars());
    await this.seedMoto();
    await this.seedPhones();
    await this.seedTablets();
    await this.seedComputers();
    await this.seedAutoParts();
    await this.seedTires();
  }

  private async seedIfEmpty(kind: CatalogKind, seed: () => Promise<void>) {
    const [count] = await this.repo.countBrands(kind);
    if ((count?.count ?? 0) > 0) {
      console.log(`${kind} catalog already seeded`);
      return;
    }
    await seed();
  }

  async seedCars() {
    const brands = await loadCarsFile();
    const brandRows = brands.map((brand) => ({
      kind: 'cars' as const,
      key: brand.id || slug(brand.name),
      name: brand.name,
      nameRu: brand.cyrillic_name ?? null,
      popular: brand.popular ? 1 : 0,
    }));
    for (const chunk of chunks(brandRows, 200)) {
      await this.repo.insertBrandsIgnoreConflicts(chunk);
    }
    const saved = await this.repo.listBrandIds('cars');
    const idByKey = new Map(saved.map((row) => [row.key, row.id]));
    const modelRows: Array<{ brandId: string; key: string; name: string; nameRu?: string | null }> =
      [];
    for (const brand of brands) {
      const brandId = idByKey.get(brand.id || slug(brand.name));
      if (!brandId) continue;
      for (const model of brand.models ?? []) {
        modelRows.push({
          brandId,
          key: model.id || slug(model.name),
          name: model.name,
          nameRu: model.cyrillic_name ?? null,
        });
      }
    }
    for (const chunk of chunks(modelRows, 400)) {
      await this.repo.insertModelsIgnoreConflicts(chunk);
    }
    console.log(`Cars catalog: ${brandRows.length} brands, ${modelRows.length} models`);
  }

  async seedPhones() {
    await this.mergeJsonKind('smartphones', await loadPhonesFile(), 'Smartphones');
  }

  async seedTablets() {
    await this.mergeJsonKind('tablets', await loadTabletsFile(), 'Tablets');
  }

  private async mergeJsonKind(
    kind: 'smartphones' | 'tablets',
    brands: Array<{ id: string; name: string; models?: Array<{ id: string; name: string }> }>,
    label: string,
  ) {
    let modelCount = 0;
    for (const brand of brands) {
      const row = await this.repo.upsertBrand({
        kind,
        key: brand.id || slug(brand.name),
        name: brand.name,
      });
      if (!row) continue;
      for (const model of brand.models ?? []) {
        await this.repo.upsertModel({
          brandId: row.id,
          key: model.id || slug(model.name),
          name: model.name,
        });
        modelCount += 1;
      }
    }
    console.log(`${label} catalog merged: ${brands.length} brands, ${modelCount} models`);
  }

  private async seedNamedList(
    kind: CatalogKind,
    brands: ReadonlyArray<{ name: string; models: readonly string[] }>,
    label: string,
  ) {
    for (const brand of brands) {
      const row = await this.repo.upsertBrand({
        kind,
        key: slug(brand.name),
        name: brand.name,
      });
      if (!row) continue;
      for (const model of brand.models) {
        await this.repo.upsertModel({
          brandId: row.id,
          key: slug(model),
          name: model,
        });
      }
    }
    console.log(
      `${label} catalog: ${brands.length} brands, ${brands.reduce((sum, brand) => sum + brand.models.length, 0)} models`,
    );
  }

  async seedMoto() {
    await this.seedNamedList('moto', MOTO_FALLBACK, 'Moto');
  }

  async seedComputers() {
    await this.seedNamedList('laptops', LAPTOP_FALLBACK, 'Laptops');
    await this.seedNamedList('desktops', DESKTOP_FALLBACK, 'Desktops');
    await this.seedNamedList('pc-parts', PC_PARTS_FALLBACK, 'PC parts');
  }

  async seedAutoParts() {
    await this.seedNamedList('auto-parts', AUTO_PARTS_FALLBACK, 'Auto parts');
  }

  async seedTires() {
    await this.seedNamedList('tires', TIRES_FALLBACK, 'Tires');
  }

  async syncFromCli(target: string) {
    await this.migrateLegacyKinds();
    const runners: Record<string, () => Promise<void>> = {
      all: () => this.seedAllIfEmpty(),
      cars: () => this.seedIfEmpty('cars', () => this.seedCars()),
      phones: () => this.seedPhones(),
      tablets: () => this.seedTablets(),
      moto: () => this.seedMoto(),
      computers: () => this.seedComputers(),
      'auto-parts': () => this.seedAutoParts(),
      tires: () => this.seedTires(),
    };
    const runner = runners[target];
    if (!runner) {
      throw new Error(`Unknown catalog target: ${target}`);
    }
    await runner();
  }
}

export function parseKind(value: string): CatalogKind {
  if (isCatalogKind(value)) return value;
  throw new ValidationError('Unknown catalog kind');
}
