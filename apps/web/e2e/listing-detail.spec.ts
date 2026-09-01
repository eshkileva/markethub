import { test, expect } from '@playwright/test';
import { expectAuthRedirect, loginDemoInBrowser } from './helpers/auth';

const apiBase = 'http://localhost:3000';

test('unknown listing redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/listings/00000000-0000-4000-8000-000000000001');
});

test('unknown listing shows not found for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page, apiBase);
  await page.goto('/listings/00000000-0000-4000-8000-000000000001');
  await expect(page.getByRole('heading', { name: 'Объявление не найдено' })).toBeVisible();
});
