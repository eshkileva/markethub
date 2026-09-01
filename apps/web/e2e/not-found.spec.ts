import { test, expect } from '@playwright/test';
import { expectAuthRedirect, loginDemoInBrowser } from './helpers/auth';

const apiBase = 'http://localhost:3000';

test('unknown route redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/this-page-does-not-exist');
});

test('unknown route shows not found for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page, apiBase);
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'В каталог' })).toBeVisible();
});
