import { test, expect } from '@playwright/test';
import { loginDemoInBrowser } from './helpers/auth';

test('unknown route shows not found when signed out', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'В каталог' })).toBeVisible();
});

test('unknown route shows not found for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page);
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'В каталог' })).toBeVisible();
});
