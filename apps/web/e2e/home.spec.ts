import { test, expect } from '@playwright/test';

test('home shell renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Купилко — вещи рядом/i })).toBeVisible();
  await expect(page.getByText('Купилко').first()).toBeVisible();
  await expect(page.getByText('Foundation')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Свежие объявления' })).toBeVisible();
});
