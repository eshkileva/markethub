import { test, expect } from '@playwright/test';

test('settings page without auth asks to log in', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();
  await expect(page.getByText('Войдите, чтобы менять профиль, пароль и сессии.')).toBeVisible();
});
