import { test, expect } from '@playwright/test';
import { loginDemoInBrowser } from './helpers/auth';

const apiBase = 'http://localhost:3000';

test('unknown listing shows not found when signed out', async ({ page }) => {
  await page.goto('/listings/00000000-0000-4000-8000-000000000001');
  await expect(page.getByRole('heading', { name: 'Объявление не найдено' })).toBeVisible();
});

test('unknown listing shows not found for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page, apiBase);
  await page.goto('/listings/00000000-0000-4000-8000-000000000001');
  await expect(page.getByRole('heading', { name: 'Объявление не найдено' })).toBeVisible();
});
