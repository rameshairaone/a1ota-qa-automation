import { test as base, expect } from '@playwright/test';
import { env } from '@config/env';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { MicrosoftLoginPage } from '@pages/MicrosoftLoginPage';
import { ApiClient } from '@api/ApiClient';
import { AuthService } from '@api/AuthService';

/**
 * Custom fixtures: tests ask for what they need (`{ loginPage, authService }`)
 * instead of constructing objects. Register every new page object or service here.
 */
type PageFixtures = {
  loginPage: LoginPage;
  microsoftLoginPage: MicrosoftLoginPage;
  dashboardPage: DashboardPage;
};

type ApiFixtures = {
  apiClient: ApiClient;
  authService: AuthService;
};

export const test = base.extend<PageFixtures & ApiFixtures>({
  /**
   * Set HOLD_OPEN_MS=30000 to keep the browser open after each UI test, to look at the final
   * screen. Overrides the built-in page fixture, so it never starts a browser for API tests.
   */
  page: async ({ page }, use, testInfo) => {
    await use(page);
    const ms = Number(process.env.HOLD_OPEN_MS ?? 0);
    if (ms > 0 && !page.isClosed()) {
      testInfo.setTimeout(testInfo.timeout + ms);
      console.log(`>>> Holding the browser open for ${ms / 1000}s on: ${page.url().slice(0, 80)}`);
      await page.waitForTimeout(ms);
    }
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  microsoftLoginPage: async ({ page }, use) => {
    await use(new MicrosoftLoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  apiClient: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: env.apiUrl });
    await use(new ApiClient(context, env.apiToken || undefined));
    await context.dispose();
  },
  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
});

export { expect };
