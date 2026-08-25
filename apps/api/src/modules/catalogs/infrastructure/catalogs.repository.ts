import { and, eq, sql } from 'drizzle-orm';
import type { CatalogKind } from '@markethub/shared';
import { MAX_CATALOG_ITEMS } from '@markethub/shared/limits';
import type { Database } from '../../../infrastructure/database/client.js';
import { catalogBrands, catalogModels } from '../../../infrastructure/database/schema/index.js';

export class CatalogsRepository {
  constructor(private readonly db: Database) {}

  countBrands(kind: CatalogKind) {
    return this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(catalogBrands)
      .where(eq(catalogBrands.kind, kind));
  }

  async listBrands(kind: CatalogKind, query?: string) {
    const conditions = [eq(catalogBrands.kind, kind)];
    if (query?.trim()) {
      const needle = `%${query.trim()}%`;
      conditions.push(
        sql`(${catalogBrands.name} ilike ${needle} or coalesce(${catalogBrands.nameRu}, '') ilike ${needle})`,
      );
    }
    return this.db
      .select({
        key: catalogBrands.key,
        name: catalogBrands.name,
        nameRu: catalogBrands.nameRu,
        popular: catalogBrands.popular,
      })
      .from(catalogBrands)
      .where(and(...conditions))
      .orderBy(sql`${catalogBrands.popular} desc`, catalogBrands.name)
      .limit(MAX_CATALOG_ITEMS);
  }

  findBrand(kind: CatalogKind, nameOrKey: string) {
    const needle = nameOrKey.trim();
    return this.db.query.catalogBrands.findFirst({
      where: (table, { and: also, eq: equals, or, ilike: like }) =>
        also(
          equals(table.kind, kind),
          or(equals(table.key, needle), like(table.name, needle), like(table.nameRu, needle)),
        ),
    });
  }

  async listModels(brandId: string, query?: string) {
    const conditions = [eq(catalogModels.brandId, brandId)];
    if (query?.trim()) {
      const needle = `%${query.trim()}%`;
      conditions.push(
        sql`(${catalogModels.name} ilike ${needle} or coalesce(${catalogModels.nameRu}, '') ilike ${needle})`,
      );
    }
    return this.db
      .select({
        key: catalogModels.key,
        name: catalogModels.name,
        nameRu: catalogModels.nameRu,
      })
      .from(catalogModels)
      .where(and(...conditions))
      .orderBy(catalogModels.name)
      .limit(MAX_CATALOG_ITEMS);
  }

  countModels(brandId: string) {
    return this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(catalogModels)
      .where(eq(catalogModels.brandId, brandId));
  }

  async insertBrandsIgnoreConflicts(
    rows: Array<{
      kind: CatalogKind;
      key: string;
      name: string;
      nameRu?: string | null;
      popular?: number;
    }>,
  ) {
    if (rows.length === 0) return;
    await this.db
      .insert(catalogBrands)
      .values(
        rows.map((row) => ({
          kind: row.kind,
          key: row.key,
          name: row.name,
          nameRu: row.nameRu ?? null,
          popular: row.popular ?? 0,
        })),
      )
      .onConflictDoNothing({ target: [catalogBrands.kind, catalogBrands.key] });
  }

  async insertModelsIgnoreConflicts(
    rows: Array<{ brandId: string; key: string; name: string; nameRu?: string | null }>,
  ) {
    if (rows.length === 0) return;
    await this.db
      .insert(catalogModels)
      .values(
        rows.map((row) => ({
          brandId: row.brandId,
          key: row.key,
          name: row.name,
          nameRu: row.nameRu ?? null,
        })),
      )
      .onConflictDoNothing({ target: [catalogModels.brandId, catalogModels.key] });
  }

  async listBrandNames(kind: CatalogKind) {
    return this.db
      .select({ id: catalogBrands.id, name: catalogBrands.name })
      .from(catalogBrands)
      .where(eq(catalogBrands.kind, kind));
  }

  async listBrandIds(kind: CatalogKind) {
    return this.db
      .select({ id: catalogBrands.id, key: catalogBrands.key })
      .from(catalogBrands)
      .where(eq(catalogBrands.kind, kind));
  }

  async upsertBrand(input: {
    kind: CatalogKind;
    key: string;
    name: string;
    nameRu?: string | null;
    popular?: number;
  }) {
    const [row] = await this.db
      .insert(catalogBrands)
      .values({
        kind: input.kind,
        key: input.key,
        name: input.name,
        nameRu: input.nameRu ?? null,
        popular: input.popular ?? 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [catalogBrands.kind, catalogBrands.key],
        set: {
          name: input.name,
          nameRu: input.nameRu ?? null,
          popular: input.popular ?? 0,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async upsertModel(input: { brandId: string; key: string; name: string; nameRu?: string | null }) {
    await this.db
      .insert(catalogModels)
      .values({
        brandId: input.brandId,
        key: input.key,
        name: input.name,
        nameRu: input.nameRu ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [catalogModels.brandId, catalogModels.key],
        set: {
          name: input.name,
          nameRu: input.nameRu ?? null,
          updatedAt: new Date(),
        },
      });
  }

  async rekeyKind(from: string, to: string) {
    await this.db
      .update(catalogBrands)
      .set({ kind: to, updatedAt: new Date() })
      .where(eq(catalogBrands.kind, from));
  }

  async deleteBrandsByKind(kind: string) {
    await this.db.delete(catalogBrands).where(eq(catalogBrands.kind, kind));
  }
}
