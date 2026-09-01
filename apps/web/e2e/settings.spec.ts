import { test, expect } from '@playwright/test';

test('settings is public for guests with appearance section', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Оформление' })).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Войти или зарегистрироваться' }),
  ).toBeVisible();
});
