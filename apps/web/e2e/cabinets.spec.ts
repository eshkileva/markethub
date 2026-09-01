import { test, expect } from '@playwright/test';
import { registerVerifiedUser, seedBrowserSession } from './helpers/auth';

test('signed-in cabinets are real pages not stubs', async ({ page }) => {
  const stamp = Date.now();
  const email = `walk_${stamp}@example.com`;
  const username = `walk_${stamp}`;
  const session = await registerVerifiedUser(page.request, {
    email,
    password: 'password12',
    username,
    country: 'RU',
    displayName: 'Walker',
  });

  await seedBrowserSession(page, session);

  await page.goto('/');
  await expect(page.getByText('Foundation')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Все объявления|Каталог/ }).first()).toBeVisible();

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Фильтры' })).toBeVisible();
  await expect(page.locator('a[href^="/listings/"]').first()).toBeVisible({ timeout: 15000 });

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: /Настройки/ })).toBeVisible();
  await expect(page.getByText(/Connected AuthIdentity|заложен/)).toHaveCount(0);

  await page.goto('/my-listings');
  await expect(page.getByRole('heading', { name: 'Мои объявления' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Разместить' })).toBeVisible();

  await page.goto('/sales');
  await expect(page.getByRole('heading', { name: 'Продажи' })).toBeVisible();

  await page.goto('/purchases');
  await expect(page.getByRole('heading', { name: 'Покупки' })).toBeVisible();

  await page.goto('/messages');
  await expect(page.getByRole('heading', { name: /Сообщения|Чаты/ })).toBeVisible();

  await page.goto(`/profile/${username}`);
  await expect(page.getByRole('heading', { name: 'Walker' })).toBeVisible();
  await expect(page.getByRole('main').getByText('Trust Score')).toBeVisible();
});
