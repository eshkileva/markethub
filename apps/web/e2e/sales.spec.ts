import { test, expect } from '@playwright/test';

test('sales page without auth asks to log in', async ({ page }) => {
  await page.goto('/sales');
  await expect(page.getByRole('heading', { name: 'Продажи' })).toBeVisible();
  await expect(
    page.getByText('Войдите, чтобы бронировать объявления и отмечать продажи.'),
  ).toBeVisible();
});
