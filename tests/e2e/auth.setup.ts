import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

// Longer timeout for manual OTP entry
setup.setTimeout(180000); // 3 minutes

/**
 * This setup test saves authenticated state for reuse in other tests.
 *
 * To use:
 * 1. Run: pnpm test:e2e:setup
 * 2. Complete the OTP verification manually in the browser
 * 3. The auth state will be saved for subsequent tests
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/');

  // Wait for login page
  await expect(page.getByText('Spillover')).toBeVisible();

  // Enter your test email
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByRole('button', { name: /send code/i }).click();

  // Wait for OTP input
  await expect(page.getByPlaceholder('Enter code')).toBeVisible({ timeout: 10000 });

  // MANUAL STEP: Enter the OTP from your email
  // The test will pause here - enter the code manually
  console.log('\n📧 Check your email for the OTP code and enter it in the browser...\n');

  // Wait for redirect to dashboard (up to 2 minutes for manual OTP entry)
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 120000 });

  // Verify we're logged in
  await expect(page.getByText('Party Games')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log('\n✅ Auth state saved! You can now run the full test suite.\n');
});
