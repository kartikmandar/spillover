import { test, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

test.describe('Dashboard', () => {
  test.use({ storageState: authFile });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('displays dashboard correctly', async ({ page }) => {
    // Check app header
    await expect(page.getByRole('heading', { name: 'Spillover' })).toBeVisible();

    // Check greeting
    await expect(page.getByText(/hey,/i)).toBeVisible();
  });

  test('shows countdown timer', async ({ page }) => {
    // Look for countdown elements
    await expect(page.getByText(/new year 2026/i)).toBeVisible();

    // Should show time units
    await expect(page.getByText(/days|hours|min|sec/i).first()).toBeVisible();
  });

  test('shows all game cards', async ({ page }) => {
    // Check game card content is visible
    await expect(page.getByText(/share anonymous spicy opinions/i)).toBeVisible();
    await expect(page.getByText(/can they spot your lie/i)).toBeVisible();
    await expect(page.getByText(/see who is winning/i)).toBeVisible();
  });

  test('shows user score', async ({ page }) => {
    await expect(page.getByText(/your score/i)).toBeVisible();
  });

  test('shows how to play section', async ({ page }) => {
    await expect(page.getByText(/how to play/i)).toBeVisible();
    await expect(page.getByText(/\+10 points/i)).toBeVisible();
  });

  test('can navigate to Hot Takes', async ({ page }) => {
    // Click the card link
    await page.getByRole('link', { name: /hot takes.*share anonymous/i }).click();
    await expect(page).toHaveURL(/\/hot-takes/);
  });

  test('can navigate to Two Truths', async ({ page }) => {
    await page.getByRole('link', { name: /two truths.*can they/i }).click();
    await expect(page).toHaveURL(/\/two-truths/);
  });

  test('can navigate to Leaderboard', async ({ page }) => {
    await page.getByRole('link', { name: /leaderboard.*see who/i }).click();
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test('has logout button', async ({ page }) => {
    // Logout button should be visible in header
    await expect(page.locator('header button').last()).toBeVisible();
  });

  test('mobile nav is visible', async ({ page }) => {
    // Mobile nav should be at the bottom
    await expect(page.locator('nav').first()).toBeVisible();
  });
});
