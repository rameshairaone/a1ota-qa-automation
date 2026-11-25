import { test, expect } from '@fixtures';
import { canLogIn, env, hasSso } from '@config/env';
import { NAV_ITEMS } from '@components/SidebarComponent';

// Starts already logged in, using the session saved by auth.setup.ts.
test.describe('Dashboard', () => {
  test.skip(!canLogIn(), 'No SSO_USER or STANDARD_USER configured');

  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test('opens the System Diagnostics dashboard @smoke @positive @needs-login', async ({ dashboardPage }) => {
    await dashboardPage.expectOnPage();
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.header.themeToggle).toBeVisible();
    await expect(dashboardPage.apiRoutesTable).toBeVisible();
  });

  test('shows the signed-in user in the sidebar @regression @positive @needs-login', async ({ dashboardPage }) => {
    test.skip(!hasSso(), 'Checks the SSO user');
    await expect(dashboardPage.sidebar.userEmail(env.sso.username)).toBeVisible();
    await expect(dashboardPage.sidebar.signOutButton).toBeVisible();
  });

  test('sidebar shows every navigation link @regression @positive @needs-login', async ({ dashboardPage }) => {
    for (const item of Object.keys(NAV_ITEMS) as (keyof typeof NAV_ITEMS)[]) {
      await expect(dashboardPage.sidebar.link(item), `${item} link`).toBeVisible();
    }
  });

  test('sidebar navigates to Workflows and back @regression @positive @needs-login', async ({ page, dashboardPage }) => {
    await dashboardPage.sidebar.navigateTo('Workflows');
    await expect(page).toHaveURL(/\/admin\/workflows/);

    await dashboardPage.sidebar.navigateTo('Dashboard');
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('API route search filters the table @regression @positive @needs-login', async ({ dashboardPage }) => {
    await expect(dashboardPage.apiRouteRows.first()).toBeVisible();

    await dashboardPage.apiRouteSearch.fill('health');
    await expect(dashboardPage.apiRouteRows.first()).toContainText('health');
    for (const row of await dashboardPage.apiRouteRows.all()) {
      await expect(row).toContainText('health');
    }
  });
});

// Signing out may end the server session, so this test signs in fresh instead of
// reusing (and invalidating) the session shared by the other tests.
test.describe('Sign out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('user can sign out @regression @positive @needs-login', async ({ loginPage, microsoftLoginPage, dashboardPage }) => {
    test.skip(!hasSso() || !env.sso.password, 'Needs SSO_USER and SSO_PASSWORD');
    await loginPage.goto();
    await loginPage.startSso();
    await microsoftLoginPage.signIn(env.sso.username, env.sso.password);
    await dashboardPage.goto();

    await dashboardPage.sidebar.signOut();

    await expect(loginPage.heading).toBeVisible();
  });
});
