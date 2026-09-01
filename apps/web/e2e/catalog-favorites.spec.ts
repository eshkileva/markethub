import { test, expect } from '@playwright/test';
import { expectAuthRedirect, registerVerifiedUser, seedBrowserSession } from './helpers/auth';

test('catalog loads and favorite toggles for signed-in user', async ({ page }) => {
  const apiBase = 'http://localhost:3000';
  const email = `seller_${Date.now()}@example.com`;
  const username = `seller_${Date.now()}`;
  const password = 'password12';

  async function assertOk(res: any, label: string) {
    if (!res.ok()) {
      const text = await res.text().catch(() => '');
      throw new Error(`${label} failed: ${res.status()} ${text}`);
    }
  }

  // 1) Create user (email/password)
  const registerJson = await registerVerifiedUser(page.request, apiBase, {
    email,
    password,
    username,
    country: 'RU',
  });
  const token = registerJson.accessToken;

  // 2) Get laptops leaf + attributes
  const catsRes = await page.request.get(`${apiBase}/v1/categories`);
  await assertOk(catsRes, 'categories');
  const catsJson = await catsRes.json();
  const laptops = catsJson.items.find((c: { slug: string }) => c.slug === 'laptops');
  if (!laptops) throw new Error('Missing laptops category seed');

  const attrsRes = await page.request.get(`${apiBase}/v1/categories/${laptops.id}/attributes`);
  await assertOk(attrsRes, 'category attributes');
  const attrsJson = await attrsRes.json();
  const manufacturer =
    attrsJson.items.find((a: any) => a.key === 'manufacturer') ?? attrsJson.items[0];

  const title = `E2E Listing ${Date.now()}`;

  // 3) Create listing as draft
  const createRes = await page.request.post(`${apiBase}/v1/listings`, {
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    data: {
      title,
      description: 'Test listing for Playwright',
      categoryId: laptops.id,
      price: 12345,
      currency: 'RUB',
      country: 'RU',
      city: 'Москва',
      condition: 'used',
      deliveryModes: ['meetup'],
      attributes: manufacturer ? [{ attributeId: manufacturer.id, value: 'NVIDIA' }] : [],
    },
  });
  await assertOk(createRes, 'create listing');
  const listingJson = await createRes.json();
  const listingId = listingJson.id as string;

  // 4) Upload a tiny PNG, attach it and publish
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');

  const uploadRes = await page.request.post(`${apiBase}/v1/media/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      file: {
        name: 'e2e.png',
        mimeType: 'image/png',
        buffer: pngBuffer,
      },
    },
  });
  await assertOk(uploadRes, 'upload image');
  const uploadJson = await uploadRes.json();

  const addImageRes = await page.request.post(`${apiBase}/v1/listings/${listingId}/images`, {
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    data: { url: uploadJson.url },
  });
  await assertOk(addImageRes, 'add image');

  const publishRes = await page.request.post(`${apiBase}/v1/listings/${listingId}/publish`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await assertOk(publishRes, 'publish listing');

  // Wait until the listing is visible in the public feed (publish -> DB -> query).
  const start = Date.now();
  let foundInFeed = false;
  while (Date.now() - start < 15000) {
    const feedRes = await page.request.get(
      `${apiBase}/v1/listings?page=1&pageSize=12&sort=newest&country=RU`,
    );
    await assertOk(feedRes, 'feed check');
    const feedJson = await feedRes.json();
    if (feedJson.items.some((it: any) => it.title === title)) {
      foundInFeed = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  if (!foundInFeed) {
    throw new Error(`Listing title not found in feed after 15s: ${title}`);
  }

  // Now open catalog with an authenticated browser session
  await seedBrowserSession(page, registerJson);
  await page.goto('/catalog?country=RU');
  await expect(page.getByRole('heading', { name: 'Каталог' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Фильтры' })).toBeVisible();
  // Product cards: filter out the top-bar "Разместить" link (`/listings/create`).
  const firstProductLink = page.locator('a[href*="listings/"]:not([href*="create"])').first();
  await expect(firstProductLink).toBeVisible({ timeout: 20000 });

  const heartButton = firstProductLink
    .locator('button[aria-label="В избранное"], button[aria-label="Убрать из избранного"]')
    .first();
  await expect(heartButton).toBeVisible();
  await heartButton.click();
  await expect(heartButton).toHaveAttribute('aria-label', 'Убрать из избранного');
});

test('favorites redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/favorites');
});

test('messages redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/messages');
});
