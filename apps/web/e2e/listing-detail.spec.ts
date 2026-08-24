import { test, expect } from '@playwright/test';

test('unknown listing shows not found', async ({ page }) => {
  await page.goto('/listings/00000000-0000-4000-8000-000000000001');
  await expect(page.getByRole('heading', { name: 'Объявление не найдено' })).toBeVisible();
});
