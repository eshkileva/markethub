import { test, expect } from '@playwright/test';

test('moderation page without auth asks to log in', async ({ page }) => {
  await page.goto('/moderation');
  await expect(page.getByRole('heading', { name: 'Модерация' })).toBeVisible();
  await expect(page.getByText('Войдите под модератором, чтобы разбирать жалобы.')).toBeVisible();
});
