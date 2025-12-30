import { test, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

test.describe('Leaderboard', () => {
  test.use({ storageState: authFile });

  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('displays leaderboard page correctly', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  });

  test('shows player rankings', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Should show rankings or your rank
    await expect(page.getByText(/your rank|rankings/i).first()).toBeVisible();
  });

  test('back button returns to dashboard', async ({ page }) => {
    // Find the back link in header
    await page.locator('a[href="/dashboard"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });
});
