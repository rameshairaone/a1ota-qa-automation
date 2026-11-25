import { test, expect } from '@fixtures';
import { env, hasCredentials } from '@config/env';
import { dataFactory } from '@utils/dataFactory';
import loginData from '@data/loginData.json';

// These tests cover login itself, so they start without the saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('login page shows the sign-in options @smoke @positive', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
    await expect(loginPage.ssoLink).toBeVisible();
    await expect(loginPage.igaLink).toBeVisible();
  });

  test('dashboard redirects to login when signed out @smoke @positive', async ({ page, loginPage }) => {
    await page.goto('dashboard');
    await expect(loginPage.heading).toBeVisible();
  });

  test('show password toggles the password field @regression @positive', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('secret-value');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.showPasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });

  test('valid user can log in @smoke @positive @needs-login', async ({ loginPage, dashboardPage }) => {
    test.skip(!hasCredentials('standard'), 'STANDARD_USER / STANDARD_PASSWORD not set');
    const { username, password } = env.users.standard;
    await loginPage.login(username, password);

    await dashboardPage.expectOnPage();
  });

  test('shows an error for a wrong password @regression @negative', async ({ loginPage }) => {
    test.skip(!hasCredentials('standard'), 'STANDARD_USER not set');
    await loginPage.login(env.users.standard.username, dataFactory.password());

    await expect(loginPage.errorMessage).toHaveText(/invalid credentials/i);
    await loginPage.expectOnPage();
  });

  // Data-driven: one test per row in src/data/loginData.json.
  for (const data of loginData.invalidLogins) {
    test(`shows an error for ${data.case} @regression @negative`, async ({ loginPage }) => {
      await loginPage.login(data.email, data.password);

      await expect(loginPage.errorMessage).toHaveText(/invalid credentials/i);
      await loginPage.expectOnPage();
    });
  }

  test('browser validation blocks an empty or malformed email @regression @negative', async ({ loginPage }) => {
    await loginPage.login('', 'any-password');
    expect(await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);

    await loginPage.login('not-an-email', 'any-password');
    expect(await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);

    await loginPage.expectOnPage();
  });
});
