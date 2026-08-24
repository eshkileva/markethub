import { test, expect } from '@playwright/test';

test('unknown route shows not found', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'В каталог' })).toBeVisible();
});
