import { test, expect } from '@playwright/test';

test('auth page is email/password only', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Вход в MarketHub' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'VK' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Telegram' })).toHaveCount(0);
  await expect(page.getByText(/OAuth/i)).toHaveCount(0);

  await page.getByRole('button', { name: 'Нет аккаунта? Зарегистрируйтесь' }).click();
  await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible();
  await expect(page.getByLabel('Ник')).toBeVisible();
});
