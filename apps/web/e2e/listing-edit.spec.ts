import { test, expect } from '@playwright/test';

test('edit listing without auth asks to log in', async ({ page }) => {
  await page.goto('/listings/00000000-0000-4000-8000-000000000001/edit');
  await expect(page.getByRole('heading', { name: 'Редактирование' })).toBeVisible();
  await expect(page.getByText('Войдите, чтобы изменить объявление.')).toBeVisible();
});
