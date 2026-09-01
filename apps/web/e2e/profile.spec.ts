import { test, expect } from '@playwright/test';
import { loginDemoInBrowser } from './helpers/auth';

const apiBase = 'http://localhost:3000';

test('unknown profile shows not found when signed out', async ({ page }) => {
  await page.goto('/profile/no_such_user_zzz');
  await expect(page.getByRole('heading', { name: 'Пользователь не найден' })).toBeVisible();
});

test('unknown profile shows not found for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page, apiBase);
  await page.goto('/profile/no_such_user_zzz');
  await expect(page.getByRole('heading', { name: 'Пользователь не найден' })).toBeVisible();
});
