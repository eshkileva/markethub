import { test, expect } from '@playwright/test';

test('my listings page without auth asks to log in', async ({ page }) => {
  await page.goto('/my-listings');
  await expect(page.getByRole('heading', { name: 'Мои объявления' })).toBeVisible();
  await expect(
    page.getByText('Войдите, чтобы управлять черновиками и опубликованными объявлениями.'),
  ).toBeVisible();
});
