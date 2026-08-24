import { test, expect } from '@playwright/test';

test('purchases page without auth asks to log in', async ({ page }) => {
  await page.goto('/purchases');
  await expect(page.getByRole('heading', { name: 'Покупки' })).toBeVisible();
  await expect(
    page.getByText('Войдите, чтобы видеть объявления, по которым вы пишете продавцам.'),
  ).toBeVisible();
});
