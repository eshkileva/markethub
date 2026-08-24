import { test, expect } from '@playwright/test';

test('home shell renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Покупайте и продавайте/i })).toBeVisible();
  await expect(page.getByText('MarketHub')).toBeVisible();
  await expect(page.getByText('Foundation')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Рекомендуемые объявления' })).toBeVisible();
});
