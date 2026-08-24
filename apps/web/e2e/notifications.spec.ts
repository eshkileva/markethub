import { test, expect } from '@playwright/test';

test('notifications page without auth asks to log in', async ({ page }) => {
  await page.goto('/notifications');
  await expect(page.getByRole('heading', { name: 'Уведомления' })).toBeVisible();
  await expect(
    page.getByText('Войдите, чтобы видеть сообщения, отзывы и решения модерации.'),
  ).toBeVisible();
});
