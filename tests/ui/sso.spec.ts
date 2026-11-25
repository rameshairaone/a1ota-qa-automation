import { test, expect } from '@fixtures';
import { env, hasSso } from '@config/env';

// Start signed out so the SSO flow is exercised from the beginning.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Single sign-on (Microsoft Entra ID)', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('SSO button redirects to the Airaone Microsoft tenant @smoke @positive', async ({ page, loginPage, microsoftLoginPage }) => {
    await loginPage.startSso();

    await microsoftLoginPage.expectOnPage();
    // The OIDC request must send the user back to this app's callback.
    const authorize = new URL(page.url());
    expect(authorize.searchParams.get('redirect_uri')).toBe(new URL('/uiapi/oidc/callback', env.baseUrl).href);
    expect(authorize.searchParams.get('scope')).toContain('openid');
  });

  test('SSO user reaches the password step @regression @positive', async ({ page, loginPage, microsoftLoginPage }) => {
    test.skip(!hasSso(), 'SSO_USER not set');
    await loginPage.startSso();
    await microsoftLoginPage.enterEmail(env.sso.username);

    // Wait until the Microsoft password page is fully displayed for this account.
    await expect(microsoftLoginPage.passwordHeading).toBeVisible();
    await expect(page.getByText(env.sso.username)).toBeVisible();
    await expect(microsoftLoginPage.passwordInput).toBeVisible();
    await expect(microsoftLoginPage.passwordInput).toBeEditable();
  });

  test('SSO user can sign in and open the dashboard @smoke @positive @needs-login', async ({ loginPage, microsoftLoginPage, dashboardPage }) => {
    test.skip(!hasSso() || !env.sso.password, 'Needs SSO_USER and SSO_PASSWORD (manual sign-in is only done once, in setup)');
    await loginPage.startSso();
    await microsoftLoginPage.signIn(env.sso.username, env.sso.password);

    await dashboardPage.goto();
    await expect(loginPage.heading).toBeHidden();
  });
});
