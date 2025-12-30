import { test, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

test.describe('Hot Takes', () => {
  test.use({ storageState: authFile });

  test.beforeEach(async ({ page }) => {
    await page.goto('/hot-takes');
  });

  test('displays hot takes page correctly', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Hot Takes' })).toBeVisible();

    // Check submit form exists
    await expect(page.getByPlaceholder('Share your spiciest opinion...')).toBeVisible();

    // Check My Takes button
    await expect(page.getByRole('link', { name: /my takes/i })).toBeVisible();
  });

  test('shows character counter', async ({ page }) => {
    // Character counter should show /500
    await expect(page.getByText(/\/500/)).toBeVisible();
  });

  test('input has maxlength attribute', async ({ page }) => {
    const input = page.getByPlaceholder('Share your spiciest opinion...');
    await expect(input).toHaveAttribute('maxlength', '500');
  });

  test('can vote on a hot take if available', async ({ page }) => {
    // Wait for hot takes to load
    await page.waitForTimeout(2000);

    // Find vote buttons
    const agreeButtons = page.locator('button:has-text("Agree")');
    const count = await agreeButtons.count();

    if (count > 0) {
      // Try to vote on first available
      await agreeButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('can add emoji reaction if available', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find emoji buttons
    const emojiButton = page.locator('button').filter({ hasText: '🔥' }).first();

    if (await emojiButton.isVisible()) {
      await emojiButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('shows feed section', async ({ page }) => {
    await expect(page.getByText(/feed/i)).toBeVisible();
  });

  test('navigates to My Takes page', async ({ page }) => {
    const myTakesLink = page.getByRole('link', { name: /my takes/i });
    await myTakesLink.click();
    await page.waitForURL(/\/hot-takes\/my-takes/, { timeout: 10000 });
  });

  test('back button returns to dashboard', async ({ page }) => {
    // Find the back link in header (href="/dashboard")
    await page.locator('a[href="/dashboard"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });
});
