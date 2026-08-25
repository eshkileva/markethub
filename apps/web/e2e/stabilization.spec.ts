import { test, expect } from '@playwright/test';

const apiBase = 'http://localhost:3000';

async function assertOk(res: { ok(): boolean; status(): number; text(): Promise<string> }, label: string) {
  if (!res.ok()) {
    const text = await res.text().catch(() => '');
    throw new Error(`${label} failed: ${res.status()} ${text}`);
  }
}

test.describe('stabilization API smoke', () => {
  test('geo cities cap without q and finds Omsk with q', async ({ request }) => {
    const allRes = await request.get(`${apiBase}/v1/geo/cities?country=RU`);
    await assertOk(allRes, 'cities RU');
    const allJson = await allRes.json();
    expect(allJson.items.length).toBeLessThanOrEqual(50);
    expect(allJson.items.some((city: { nameRu: string }) => city.nameRu === 'Омск')).toBe(false);

    const searchRes = await request.get(`${apiBase}/v1/geo/cities?country=RU&q=${encodeURIComponent('Омск')}`);
    await assertOk(searchRes, 'cities RU q=Omsk');
    const searchJson = await searchRes.json();
    expect(searchJson.items.some((city: { nameRu: string }) => city.nameRu === 'Омск')).toBe(true);
  });

  test('cars and moto catalogs are leaf-scoped', async ({ request }) => {
    const carsRes = await request.get(`${apiBase}/v1/catalogs/cars/brands`);
    await assertOk(carsRes, 'cars brands');
    const motoRes = await request.get(`${apiBase}/v1/catalogs/moto/brands`);
    await assertOk(motoRes, 'moto brands');

    const cars = (await carsRes.json()).items as Array<{ name: string }>;
    const moto = (await motoRes.json()).items as Array<{ name: string }>;
    expect(cars.length).toBeGreaterThan(0);
    expect(moto.length).toBeGreaterThan(0);
    expect(cars.some((brand) => brand.name === 'Toyota')).toBe(true);
    expect(moto.some((brand) => brand.name === 'Yamaha')).toBe(true);
    expect(cars.some((brand) => brand.name === 'Yamaha')).toBe(false);
  });

  test('phones root filter includes smartphones demo listing', async ({ request }) => {
    const catsRes = await request.get(`${apiBase}/v1/categories`);
    await assertOk(catsRes, 'categories');
    const catsJson = await catsRes.json();
    const phones = catsJson.items.find((c: { slug: string }) => c.slug === 'phones');
    const smartphones = catsJson.items.find((c: { slug: string }) => c.slug === 'smartphones');
    const moto = catsJson.items.find((c: { slug: string }) => c.slug === 'moto');
    if (!phones || !smartphones || !moto) {
      throw new Error('Missing phones/smartphones/moto categories in seed');
    }

    const phonesFeed = await request.get(
      `${apiBase}/v1/listings?categoryId=${phones.id}&page=1&pageSize=20`,
    );
    await assertOk(phonesFeed, 'phones feed');
    const phonesJson = await phonesFeed.json();
    expect(phonesJson.items.length).toBeGreaterThan(0);

    const motoFeed = await request.get(
      `${apiBase}/v1/listings?categoryId=${moto.id}&page=1&pageSize=20`,
    );
    await assertOk(motoFeed, 'moto feed');
    const motoJson = await motoFeed.json();
    const phoneTitles = new Set(phonesJson.items.map((item: { title: string }) => item.title));
    for (const item of motoJson.items as Array<{ title: string }>) {
      expect(phoneTitles.has(item.title)).toBe(false);
    }
  });

  test('creating listing on root category returns 422', async ({ request }) => {
    const email = `root422_${Date.now()}@example.com`;
    const registerRes = await request.post(`${apiBase}/v1/auth/register`, {
      data: {
        email,
        password: 'password12',
        username: `root422_${Date.now()}`,
        country: 'RU',
      },
    });
    await assertOk(registerRes, 'register');
    const { accessToken } = await registerRes.json();

    const catsRes = await request.get(`${apiBase}/v1/categories`);
    await assertOk(catsRes, 'categories');
    const phones = (await catsRes.json()).items.find((c: { slug: string }) => c.slug === 'phones');
    if (!phones) throw new Error('Missing phones root');

    const createRes = await request.post(`${apiBase}/v1/listings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: 'Root category listing',
        description: 'Should fail because phones is a root',
        categoryId: phones.id,
        price: 1000,
        currency: 'RUB',
        country: 'RU',
        city: 'Москва',
        condition: 'used',
        deliveryModes: ['meetup'],
        attributes: [],
      },
    });
    expect(createRes.status()).toBe(422);
    const body = await createRes.json();
    expect(JSON.stringify(body)).toContain('подкатегор');
  });
});
