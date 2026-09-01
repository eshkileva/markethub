import { test, expect } from '@playwright/test';
import { expectAuthRedirect, loginDemoInBrowser } from './helpers/auth';

const apiBase = 'http://localhost:3000';

test('home redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/');
});

test('home shell renders for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page, apiBase);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Купилко — вещи рядом/i })).toBeVisible();
  await expect(page.getByText('Купилко').first()).toBeVisible();
  await expect(page.getByText('Foundation')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Свежие объявления' })).toBeVisible();
});
