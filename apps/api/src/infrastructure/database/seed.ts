import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { and, eq, inArray } from 'drizzle-orm';
import { allCities, demoListingImageSvg, isHotlinkPlaceholder } from '@markethub/shared';
import { loadConfig } from '../../config/env.js';
import { hashPassword } from '../../modules/auth/domain/crypto.js';
import { createObjectStorage, type ObjectStorage } from '../storage/s3.js';
import { createDatabase } from './client.js';
import {
  authIdentities,
  categories,
  categoryAttributes,
  listingAttributes,
  listingImages,
  listings,
  users,
} from './schema/index.js';
import { CATEGORY_ATTRIBUTE_DEFS, DEMO_LISTING_ATTRIBUTES } from './category-attributes.seed.js';
import { SEED_LEAVES, SEED_ROOTS, leafSlugForRoot } from './category-tree.seed.js';
import { CatalogsRepository } from '../../modules/catalogs/infrastructure/catalogs.repository.js';
import { CatalogsService } from '../../modules/catalogs/application/catalogs.service.js';
import { CitiesRepository } from '../../modules/geo/infrastructure/cities.repository.js';

loadDotenv({ path: path.resolve(process.cwd(), '../../.env') });
loadDotenv();

const MODERATOR_EMAIL = 'moderator@markethub.local';
const MODERATOR_USERNAME = 'moderator';
const MODERATOR_PASSWORD = 'password12';

async function seedCategories(db: ReturnType<typeof createDatabase>['db']) {
  for (const root of SEED_ROOTS) {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, root.slug))
      .limit(1);
    if (!existing) {
      await db.insert(categories).values({ ...root, parentId: null });
      continue;
    }
    await db
      .update(categories)
      .set({
        nameRu: root.nameRu,
        icon: root.icon,
        sortOrder: root.sortOrder,
        parentId: null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, existing.id));
  }

  const roots = await db.select().from(categories);
  const bySlug = new Map(roots.map((item) => [item.slug, item]));

  for (const leaf of SEED_LEAVES) {
    const parent = bySlug.get(leaf.parentSlug);
    if (!parent) continue;
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, leaf.slug))
      .limit(1);
    if (!existing) {
      const [row] = await db
        .insert(categories)
        .values({
          slug: leaf.slug,
          nameRu: leaf.nameRu,
          parentId: parent.id,
          sortOrder: leaf.sortOrder,
        })
        .returning();
      if (row) bySlug.set(row.slug, row);
      continue;
    }
    await db
      .update(categories)
      .set({
        nameRu: leaf.nameRu,
        parentId: parent.id,
        sortOrder: leaf.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, existing.id));
  }

  console.log(`Categories upserted: ${SEED_ROOTS.length} roots, ${SEED_LEAVES.length} leaves`);
}

async function remapListingsToLeaves(db: ReturnType<typeof createDatabase>['db']) {
  const cats = await db.select().from(categories);
  const byId = new Map(cats.map((item) => [item.id, item]));
  const bySlug = new Map(cats.map((item) => [item.slug, item]));
  const rows = await db.select({ id: listings.id, categoryId: listings.categoryId }).from(listings);
  let moved = 0;

  for (const listing of rows) {
    const cat = byId.get(listing.categoryId);
    if (!cat || cat.parentId) continue;
    const hasChildren = cats.some((item) => item.parentId === cat.id);
    if (!hasChildren) continue;

    const attrs = await db
      .select({
        id: listingAttributes.id,
        attributeId: listingAttributes.attributeId,
        value: listingAttributes.value,
        key: categoryAttributes.key,
      })
      .from(listingAttributes)
      .innerJoin(categoryAttributes, eq(categoryAttributes.id, listingAttributes.attributeId))
      .where(eq(listingAttributes.listingId, listing.id));

    const kind = attrs.find((item) => item.key === 'kind')?.value;
    const leaf = bySlug.get(leafSlugForRoot(cat.slug, kind));
    if (!leaf) continue;

    const leafDefs = await db
      .select()
      .from(categoryAttributes)
      .where(eq(categoryAttributes.categoryId, leaf.id));
    const defByKey = new Map(leafDefs.map((item) => [item.key, item]));

    for (const attr of attrs) {
      if (attr.key === 'kind') {
        await db.delete(listingAttributes).where(eq(listingAttributes.id, attr.id));
        continue;
      }
      const next = defByKey.get(attr.key);
      if (!next) {
        await db.delete(listingAttributes).where(eq(listingAttributes.id, attr.id));
        continue;
      }
      if (next.id !== attr.attributeId) {
        await db
          .update(listingAttributes)
          .set({ attributeId: next.id })
          .where(eq(listingAttributes.id, attr.id));
      }
    }

    await db
      .update(listings)
      .set({ categoryId: leaf.id, updatedAt: new Date() })
      .where(eq(listings.id, listing.id));
    moved += 1;
  }

  const kindDefs = await db
    .select({ id: categoryAttributes.id })
    .from(categoryAttributes)
    .where(eq(categoryAttributes.key, 'kind'));
  for (const def of kindDefs) {
    await db.delete(listingAttributes).where(eq(listingAttributes.attributeId, def.id));
    await db.delete(categoryAttributes).where(eq(categoryAttributes.id, def.id));
  }

  if (moved > 0) console.log(`Remapped ${moved} listings to leaf categories`);

  const rootIds = cats.filter((item) => cats.some((child) => child.parentId === item.id)).map((item) => item.id);
  if (rootIds.length > 0) {
    const stale = await db
      .select({ id: categoryAttributes.id })
      .from(categoryAttributes)
      .where(inArray(categoryAttributes.categoryId, rootIds));
    for (const def of stale) {
      await db.delete(listingAttributes).where(eq(listingAttributes.attributeId, def.id));
      await db.delete(categoryAttributes).where(eq(categoryAttributes.id, def.id));
    }
  }
}

async function seedCategoryAttributes(db: ReturnType<typeof createDatabase>['db']) {
  const cats = await db.select().from(categories);
  const bySlug = new Map(cats.map((item) => [item.slug, item]));
  let added = 0;
  let updated = 0;

  for (const [slug, defs] of Object.entries(CATEGORY_ATTRIBUTE_DEFS)) {
    const category = bySlug.get(slug);
    if (!category) continue;
    const existing = await db
      .select()
      .from(categoryAttributes)
      .where(eq(categoryAttributes.categoryId, category.id));
    const byKey = new Map(existing.map((item) => [item.key, item]));

    for (const def of defs) {
      const current = byKey.get(def.key);
      if (!current) {
        await db.insert(categoryAttributes).values({
          categoryId: category.id,
          key: def.key,
          labelRu: def.labelRu,
          type: def.type,
          options: def.options ?? null,
          required: def.required,
          sortOrder: def.sortOrder,
          dictionary: def.dictionary ?? null,
          parentKey: def.parentKey ?? null,
        });
        added += 1;
        continue;
      }
      await db
        .update(categoryAttributes)
        .set({
          labelRu: def.labelRu,
          type: def.type,
          options: def.options ?? null,
          required: def.required,
          sortOrder: def.sortOrder,
          dictionary: def.dictionary ?? null,
          parentKey: def.parentKey ?? null,
        })
        .where(eq(categoryAttributes.id, current.id));
      updated += 1;
    }
  }

  if (added === 0 && updated === 0) {
    console.log('Category attributes already seeded');
    return;
  }
  console.log(`Category attributes: added ${added}, updated ${updated}`);
}

async function attachDemoAttributes(
  db: ReturnType<typeof createDatabase>['db'],
  listingId: string,
  categoryId: string,
  values: Record<string, string>,
) {
  const defs = await db
    .select()
    .from(categoryAttributes)
    .where(eq(categoryAttributes.categoryId, categoryId));
  for (const [key, value] of Object.entries(values)) {
    const def = defs.find((item) => item.key === key);
    if (!def) continue;
    const [current] = await db
      .select({ id: listingAttributes.id })
      .from(listingAttributes)
      .where(
        and(eq(listingAttributes.listingId, listingId), eq(listingAttributes.attributeId, def.id)),
      )
      .limit(1);
    if (current) {
      await db.update(listingAttributes).set({ value }).where(eq(listingAttributes.id, current.id));
    } else {
      await db.insert(listingAttributes).values({
        listingId,
        attributeId: def.id,
        value,
      });
    }
  }
}

async function ensureModerator(db: ReturnType<typeof createDatabase>['db']) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, MODERATOR_EMAIL),
  });
  if (existing) {
    if (existing.role !== 'moderator' && existing.role !== 'admin') {
      await db
        .update(users)
        .set({ role: 'moderator', updatedAt: new Date() })
        .where(eq(users.id, existing.id));
      console.log('Promoted existing moderator@markethub.local to moderator');
    } else {
      console.log('Moderator account already exists');
    }
    return;
  }

  const takenUsername = await db.query.users.findFirst({
    where: eq(users.username, MODERATOR_USERNAME),
  });
  const username = takenUsername ? 'mh_moderator' : MODERATOR_USERNAME;

  const passwordHash = await hashPassword(MODERATOR_PASSWORD);
  const [user] = await db
    .insert(users)
    .values({
      email: MODERATOR_EMAIL,
      username,
      displayName: 'Модератор',
      country: 'RU',
      role: 'moderator',
    })
    .returning();
  if (!user) {
    throw new Error('Failed to create moderator');
  }
  await db.insert(authIdentities).values({
    userId: user.id,
    provider: 'email',
    providerAccountId: MODERATOR_EMAIL,
    passwordHash,
  });
  console.log(`Created moderator ${MODERATOR_EMAIL} / ${MODERATOR_PASSWORD}`);
}

const DEMO_EMAIL = 'demo@markethub.local';
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'password12';

async function ensureDemoSeller(db: ReturnType<typeof createDatabase>['db']) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });
  if (existing) return existing;

  const takenUsername = await db.query.users.findFirst({
    where: eq(users.username, DEMO_USERNAME),
  });
  const username = takenUsername ? 'mh_demo' : DEMO_USERNAME;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      username,
      displayName: 'Демо-продавец',
      country: 'RU',
      city: 'Москва',
      bio: 'Тестовый продавец для наполнения каталога.',
    })
    .returning();
  if (!user) {
    throw new Error('Failed to create demo seller');
  }
  await db.insert(authIdentities).values({
    userId: user.id,
    provider: 'email',
    providerAccountId: DEMO_EMAIL,
    passwordHash,
  });
  console.log(`Created demo seller ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return user;
}

async function storeDemoImage(storage: ObjectStorage, slug: string, title: string) {
  return storage.putObject(
    `seed/${slug}.svg`,
    Buffer.from(demoListingImageSvg(title, slug), 'utf8'),
    'image/svg+xml',
  );
}

async function seedDemoListings(
  db: ReturnType<typeof createDatabase>['db'],
  storage: ObjectStorage,
) {
  const seller = await ensureDemoSeller(db);
  const cats = await db.select().from(categories);
  const bySlug = new Map(cats.map((item) => [item.slug, item]));

  const demos = [
    {
      slug: 'iphone13',
      title: 'iPhone 13 128GB, отличное состояние',
      description: 'Телефон без сколов, батарея держит день. Комплект: коробка и кабель.',
      price: '1450',
      currency: 'BYN' as const,
      country: 'BY' as const,
      city: 'Минск',
      condition: 'used' as const,
      deliveryModes: ['meetup', 'post'],
      category: 'smartphones',
    },
    {
      slug: 'macbook',
      title: 'MacBook Air M1 8/256',
      description: 'Рабочий ноутбук для учёбы и офиса. Клавиатура RU, следов износа мало.',
      price: '62000',
      currency: 'RUB' as const,
      country: 'RU' as const,
      city: 'Москва',
      condition: 'used' as const,
      deliveryModes: ['meetup', 'courier'],
      category: 'laptops',
    },
    {
      slug: 'washer',
      title: 'Стиральная машина Samsung 7 кг',
      description: 'Самовывоз из Алматы. Работает тихо, есть доставка по городу.',
      price: '89000',
      currency: 'KZT' as const,
      country: 'KZ' as const,
      city: 'Алматы',
      condition: 'used' as const,
      deliveryModes: ['meetup', 'courier'],
      category: 'large-appliances',
    },
    {
      slug: 'bike',
      title: 'Горный велосипед 29"',
      description: 'Рама M, переключатели Shimano. Катался один сезон, готов к поездкам.',
      price: '890',
      currency: 'BYN' as const,
      country: 'BY' as const,
      city: 'Гродно',
      condition: 'used' as const,
      deliveryModes: ['meetup'],
      category: 'bikes',
    },
    {
      slug: 'jacket',
      title: 'Зимняя куртка, размер L',
      description: 'Тёплая, без пятен. Подойдёт на температуру до −20. Примерка в центре.',
      price: '4500',
      currency: 'RUB' as const,
      country: 'RU' as const,
      city: 'Санкт-Петербург',
      condition: 'used' as const,
      deliveryModes: ['meetup', 'post'],
      category: 'clothes',
    },
    {
      slug: 'sofa',
      title: 'Диван-кровать, серый',
      description: 'Механизм еврокнижка, ящик для белья. Самовывоз из Астаны.',
      price: '120000',
      currency: 'KZT' as const,
      country: 'KZ' as const,
      city: 'Астана',
      condition: 'used' as const,
      deliveryModes: ['meetup'],
      category: 'furniture',
    },
    {
      slug: 'monitor',
      title: 'Монитор 27" 144 Гц',
      description: 'IPS, кабель в комплекте. Для игр и работы, без битых пикселей.',
      price: '18500',
      currency: 'RUB' as const,
      country: 'RU' as const,
      city: 'Казань',
      condition: 'used' as const,
      deliveryModes: ['meetup', 'post'],
      category: 'tv-video',
    },
    {
      slug: 'headphones',
      title: 'Беспроводные наушники Sony',
      description: 'Шумоподавление работает, кейс без трещин. Полный заряд держит долго.',
      price: '420',
      currency: 'BYN' as const,
      country: 'BY' as const,
      city: 'Брест',
      condition: 'used' as const,
      deliveryModes: ['meetup', 'post'],
      category: 'audio',
    },
    {
      slug: 'ps5',
      title: 'PlayStation 5 с двумя геймпадами',
      description: 'Прошита официально, дисковод читает. Игры не входят, только консоль.',
      price: '48000',
      currency: 'RUB' as const,
      country: 'RU' as const,
      city: 'Москва',
      condition: 'used' as const,
      deliveryModes: ['meetup'],
      category: 'consoles',
    },
    {
      slug: 'coffee',
      title: 'Кофемашина DeLonghi, как новая',
      description: 'Капучинатор, почти не пользовались. Отдам с фильтром и инструкцией.',
      price: '175000',
      currency: 'KZT' as const,
      country: 'KZ' as const,
      city: 'Алматы',
      condition: 'new' as const,
      deliveryModes: ['meetup', 'courier'],
      category: 'small-appliances',
    },
  ];

  const existing = await db
    .select({ id: listings.id, title: listings.title })
    .from(listings)
    .where(eq(listings.sellerId, seller.id));
  const byTitle = new Map(existing.map((row) => [row.title, row.id]));
  let created = 0;
  let updatedImages = 0;

  for (const item of demos) {
    const category = bySlug.get(item.category);
    if (!category) continue;
    const stored = await storeDemoImage(storage, item.slug, item.title);
    let listingId = byTitle.get(item.title);

    if (!listingId) {
      const [listing] = await db
        .insert(listings)
        .values({
          sellerId: seller.id,
          categoryId: category.id,
          title: item.title,
          description: item.description,
          price: item.price,
          currency: item.currency,
          country: item.country,
          city: item.city,
          condition: item.condition,
          deliveryModes: item.deliveryModes,
          status: 'published',
          publishedAt: new Date(),
        })
        .returning();
      if (!listing) continue;
      listingId = listing.id;
      created += 1;
      await db.insert(listingImages).values({
        listingId,
        url: stored.url,
        sortOrder: 0,
      });
      const demoAttrs = DEMO_LISTING_ATTRIBUTES[item.slug];
      if (demoAttrs) {
        await attachDemoAttributes(db, listingId, category.id, demoAttrs);
      }
      continue;
    }

    const images = await db
      .select({ id: listingImages.id, url: listingImages.url })
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId));
    await db
      .update(listings)
      .set({ categoryId: category.id, updatedAt: new Date() })
      .where(eq(listings.id, listingId));
    const cover = images[0];
    if (!cover) {
      await db.insert(listingImages).values({
        listingId,
        url: stored.url,
        sortOrder: 0,
      });
      updatedImages += 1;
      const demoAttrs = DEMO_LISTING_ATTRIBUTES[item.slug];
      if (demoAttrs) {
        await attachDemoAttributes(db, listingId, category.id, demoAttrs);
      }
      continue;
    }
    if (isHotlinkPlaceholder(cover.url)) {
      await db.update(listingImages).set({ url: stored.url }).where(eq(listingImages.id, cover.id));
      updatedImages += 1;
    }
    const demoAttrs = DEMO_LISTING_ATTRIBUTES[item.slug];
    if (demoAttrs) {
      await attachDemoAttributes(db, listingId, category.id, demoAttrs);
    }
  }

  if (created === 0 && updatedImages === 0) {
    console.log('Demo listings already seeded');
    return;
  }
  console.log(
    `Seeded ${created} demo listings and replaced ${updatedImages} placeholder images for ${DEMO_EMAIL}`,
  );
}

async function seedCities(db: ReturnType<typeof createDatabase>['db']) {
  const cities = new CitiesRepository(db);
  await cities.insertIgnore(allCities());
  const [row] = await cities.count();
  console.log(`Cities in dictionary: ${row?.count ?? 0}`);
}

async function seedCatalogs(db: ReturnType<typeof createDatabase>['db']) {
  const catalogs = new CatalogsService(new CatalogsRepository(db));
  await catalogs.migrateLegacyKinds();
  await catalogs.seedAllIfEmpty();
}

async function main() {
  const config = loadConfig();
  const { db, client } = createDatabase(config);
  const storage = createObjectStorage(config);
  try {
    await storage.ensureBucket();
    await seedCategories(db);
    await seedCategoryAttributes(db);
    await remapListingsToLeaves(db);
    await seedCities(db);
    await seedCatalogs(db);
    await ensureModerator(db);
    await seedDemoListings(db, storage);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
