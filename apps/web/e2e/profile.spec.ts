import { test, expect } from '@playwright/test';

test('unknown profile shows not found', async ({ page }) => {
  await page.goto('/profile/no_such_user_zzz');
  await expect(page.getByRole('heading', { name: 'Пользователь не найден' })).toBeVisible();
});
