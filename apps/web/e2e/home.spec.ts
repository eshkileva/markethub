import { test, expect } from '@playwright/test';
import { loginDemoInBrowser } from './helpers/auth';

test('home is public when signed out', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /AI уже внутри каждой сделки/i })).toBeVisible();
  await expect(page.getByText(/Смотрите объявления без регистрации/i)).toBeVisible();
});

test('home shell renders for signed-in user', async ({ page }) => {
  await loginDemoInBrowser(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /AI уже внутри каждой сделки/i })).toBeVisible();
  await expect(page.getByText('Купилко').first()).toBeVisible();
  await expect(page.getByText('Foundation')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Свежие объявления' })).toBeVisible();
});
