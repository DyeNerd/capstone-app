import { Page } from '@playwright/test';
import axios, { AxiosInstance } from 'axios';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export class AuthHelper {
  private apiUrl: string;
  private apiClient: AxiosInstance;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.apiClient = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async createTestUser(
    email?: string,
    password?: string,
    username?: string
  ): Promise<AuthResponse> {
    const userData = {
      email: email || `test-${Date.now()}@example.com`,
      username: username || `testuser${Date.now()}`,
      password: password || 'TestPassword123!',
    };

    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/register', userData);
      console.log(`✓ Created test user: ${userData.email}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to create test user:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  async loginViaAPI(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      console.log(`✓ Logged in via API: ${email}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to login via API:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  async loginViaBrowser(page: Page, email: string, password: string): Promise<void> {
    // Navigate to login page
    await page.goto('/login');

    // Fill in the login form
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to complete - app redirects to root "/" not "/dashboard"
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/dashboard', { timeout: 10000 });
    console.log(`✓ Logged in via browser: ${email}`);
  }

  async registerViaBrowser(
    page: Page,
    email: string,
    username: string,
    password: string
  ): Promise<void> {
    // Navigate to register page
    await page.goto('/register');

    // Fill in the registration form
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"], input[type="password"]', password);

    // Click register button
    await page.click('button[type="submit"]');

    // Wait for navigation to complete - app redirects to root "/" not "/dashboard"
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/dashboard', { timeout: 10000 });
    console.log(`✓ Registered via browser: ${email}`);
  }

  async setAuthToken(page: Page, token: string): Promise<void> {
    // Inject token into localStorage before navigation
    await page.evaluate((tokenValue) => {
      localStorage.setItem('token', tokenValue);
    }, token);
    console.log('✓ Auth token set in localStorage');
  }

  async getAuthToken(page: Page): Promise<string | null> {
    return page.evaluate(() => localStorage.getItem('token'));
  }

  async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
    console.log('✓ Auth cleared from localStorage');
  }

  async logout(page: Page): Promise<void> {
    // Click logout button (adjust selector based on your UI)
    await page.click('[data-testid="logout-button"], button:has-text("Logout")');

    // Wait for redirect to login page
    await page.waitForURL('**/login', { timeout: 5000 });
    console.log('✓ Logged out successfully');
  }

  async isAuthenticated(page: Page): Promise<boolean> {
    const token = await this.getAuthToken(page);
    return token !== null && token.length > 0;
  }
}
