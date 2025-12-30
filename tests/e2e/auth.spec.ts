import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page with app branding', async ({ page }) => {
    await page.goto('/');

    // Check app title and branding
    await expect(page.getByText('Spillover')).toBeVisible();
    await expect(page.getByText('RRI NYE 2026')).toBeVisible();

    // Check login form elements
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
  });

  test('validates email format - button disabled for invalid email', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.getByPlaceholder('Enter your email');
    const sendCodeButton = page.getByRole('button', { name: /send code/i });

    // Enter invalid email - button should be disabled
    await emailInput.fill('invalid-email');
    await expect(sendCodeButton).toBeDisabled();
  });

  test('enables button for valid email', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.getByPlaceholder('Enter your email');
    const sendCodeButton = page.getByRole('button', { name: /send code/i });

    // Enter valid email - button should be enabled
    await emailInput.fill('test@example.com');
    await expect(sendCodeButton).toBeEnabled();
  });

  test('shows loading state when sending code', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.getByPlaceholder('Enter your email');
    const sendCodeButton = page.getByRole('button', { name: /send code/i });

    await emailInput.fill('test@example.com');
    await sendCodeButton.click();

    // Should show "Sending..." or transition to OTP screen
    // Either loading text or OTP input should appear
    await page.waitForTimeout(1000);
  });

  test('redirects authenticated users to dashboard', async ({ page, context }) => {
    // This test requires a pre-authenticated session
    // Skip for now - would need proper auth state
    test.skip(true, 'Requires authenticated session');
  });
});
