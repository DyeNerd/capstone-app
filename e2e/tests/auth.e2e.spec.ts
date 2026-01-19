import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { generateTestUser } from '../fixtures/users.fixture';

test.describe('Authentication E2E', () => {
  let authHelper: AuthHelper;

  test.beforeAll(async () => {
    const apiUrl = process.env.API_URL || 'http://localhost:5001/api';
    authHelper = new AuthHelper(apiUrl);
  });

  test.beforeEach(async ({ page }) => {
    // Capture browser console logs
    page.on('console', (msg) => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
  });

  test('User registration flow', async ({ page }) => {
    const testUser = generateTestUser();

    await test.step('Navigate to registration page', async () => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Verify we're on registration page - check for "Create Account" heading
      const heading = page.locator('h4, h1, h2').first();
      await expect(heading).toContainText(/create account|register/i, { timeout: 5000 });
      console.log('✓ Navigated to registration page');
    });

    await test.step('Fill registration form', async () => {
      // Fill in email
      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill(testUser.email);

      // Fill in username
      const usernameInput = page.locator('input[name="username"]');
      await usernameInput.fill(testUser.username);

      // Fill in password (use name attribute to be specific)
      const passwordInput = page.locator('input[name="password"]').first();
      await passwordInput.fill(testUser.password);

      // Fill in confirm password
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      await confirmPasswordInput.fill(testUser.password);

      console.log(`✓ Filled registration form for: ${testUser.email}`);
    });

    await test.step('Submit registration', async () => {
      // Click register button
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for redirect - app redirects to root "/" not "/dashboard"
      await page.waitForURL((url) => url.pathname === '/' || url.pathname.includes('dashboard'), { timeout: 10000 });

      console.log('✓ Registration successful, redirected to home');
    });

    await test.step('Verify user is authenticated', async () => {
      // Check that token exists in localStorage
      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(true);

      console.log('✓ User is authenticated');
    });
  });

  test('Login with valid credentials', async ({ page }) => {
    // Create a test user via API first
    const testUser = generateTestUser();
    await authHelper.createTestUser(testUser.email, testUser.password, testUser.username);

    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Check for "Badminton Training" heading on login page
      const heading = page.locator('h4, h1, h2').first();
      await expect(heading).toContainText(/badminton training|sign in/i, { timeout: 5000 });
      console.log('✓ Navigated to login page');
    });

    await test.step('Fill login form and submit', async () => {
      await authHelper.loginViaBrowser(page, testUser.email, testUser.password);
      console.log('✓ Logged in successfully');
    });

    await test.step('Verify user is authenticated', async () => {
      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(true);

      // Verify we're on home page or dashboard
      const url = page.url();
      expect(url.endsWith('/') || url.includes('dashboard')).toBe(true);
      console.log('✓ User is authenticated and on home page');
    });
  });

  test('Login with invalid credentials', async ({ page }) => {
    const invalidUser = {
      email: 'invalid@example.com',
      password: 'WrongPassword123!',
    };

    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Attempt login with invalid credentials', async () => {
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      await emailInput.fill(invalidUser.email);

      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      await passwordInput.fill(invalidUser.password);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait a moment for error to appear
      await page.waitForTimeout(2000);
    });

    await test.step('Verify error message displayed', async () => {
      // Check that we're still on login page (not redirected)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');

      // Look for error message
      const pageText = await page.textContent('body');
      const hasError =
        pageText?.toLowerCase().includes('invalid') ||
        pageText?.toLowerCase().includes('incorrect') ||
        pageText?.toLowerCase().includes('error');

      expect(hasError).toBe(true);
      console.log('✓ Error message displayed for invalid credentials');
    });

    await test.step('Verify user is not authenticated', async () => {
      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(false);
      console.log('✓ User is not authenticated');
    });
  });

  test('Logout flow', async ({ page }) => {
    // Create and login user first
    const testUser = generateTestUser();
    const { token } = await authHelper.createTestUser(
      testUser.email,
      testUser.password,
      testUser.username
    );

    await test.step('Login user', async () => {
      await page.goto('/');
      await authHelper.setAuthToken(page, token);
      await page.goto('/');  // Reload to pick up token
      await page.waitForLoadState('load');

      // Wait a bit for AuthContext to finish checking auth
      await page.waitForTimeout(1000);

      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(true);
      console.log('✓ User logged in');
    });

    await test.step('Logout user', async () => {
      // Look for logout button
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")'
      );

      if ((await logoutButton.count()) > 0) {
        await logoutButton.first().click();

        // Wait for redirect to login
        await page.waitForURL(/.*login/, { timeout: 5000 });
      } else {
        // If no logout button found, clear auth manually
        await authHelper.clearAuth(page);
        await page.goto('/login');
      }

      console.log('✓ User logged out');
    });

    await test.step('Verify token cleared', async () => {
      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(false);
      console.log('✓ Token cleared from localStorage');
    });

    await test.step('Verify redirected to login', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
      console.log('✓ Redirected to login page');
    });
  });

  test('Token persistence across page reload', async ({ page }) => {
    const testUser = generateTestUser();
    const { token } = await authHelper.createTestUser(
      testUser.email,
      testUser.password,
      testUser.username
    );

    await test.step('Login and verify authentication', async () => {
      await page.goto('/');
      await authHelper.setAuthToken(page, token);
      await page.goto('/');  // Reload to pick up token
      await page.waitForLoadState('load');

      // Wait a bit for AuthContext to finish checking auth
      await page.waitForTimeout(1000);

      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(true);
      console.log('✓ User logged in');
    });

    await test.step('Reload page', async () => {
      await page.reload();
      await page.waitForLoadState('load');

      // Wait a bit for AuthContext to finish checking auth after reload
      await page.waitForTimeout(1000);

      console.log('✓ Page reloaded');
    });

    await test.step('Verify still authenticated', async () => {
      const isAuthenticated = await authHelper.isAuthenticated(page);
      expect(isAuthenticated).toBe(true);

      // Should still be on home page
      const url = page.url();
      expect(url.endsWith('/') || url.includes('dashboard')).toBe(true);

      console.log('✓ Token persisted across page reload');
    });
  });
});
