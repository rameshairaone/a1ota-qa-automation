import * as fs from 'fs';
import * as path from 'path';
import { test as setup, expect } from '@fixtures';
import { env, hasCredentials, hasSso } from '@config/env';
import { STORAGE_STATE } from '@config/constants';
import { LoginPage } from '@pages/LoginPage';

/**
 * Runs once before the UI projects. Logs in and saves cookies and local storage,
 * so UI tests start already signed in.
 *  - saved session still valid -> reused, no new login (set FORCE_LOGIN=true to skip this)
 *  - SSO_USER set              -> Microsoft single sign-on
 *  - STANDARD_USER set         -> email/password form
 *  - neither                   -> empty session; logged-in tests skip
 */
setup('authenticate', async ({ browser, page, loginPage, microsoftLoginPage, dashboardPage }) => {
  setup.setTimeout(env.sso.manualTimeoutMs + 60_000);

  // eslint-disable-next-line playwright/no-conditional-in-test -- setup chooses the login method from config
  if (!hasSso() && !hasCredentials('standard')) {
    fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, 'No SSO_USER or STANDARD_USER in .env; logged-in tests will be skipped');
  }

  // eslint-disable-next-line playwright/no-conditional-in-test -- reuse a still-valid session
  if (process.env.FORCE_LOGIN !== 'true' && (await isSavedSessionValid(browser))) {
    console.log('>>> Reusing the saved session in', STORAGE_STATE);
    return;
  }

  await loginPage.goto();

  // eslint-disable-next-line playwright/no-conditional-in-test -- setup chooses the login method from config
  if (hasSso()) {
    await loginPage.startSso();
    await microsoftLoginPage.signIn(env.sso.username, env.sso.password || undefined);
  } else {
    await loginPage.login(env.users.standard.username, env.users.standard.password);
  }

  // Confirm the session works: the dashboard must open without bouncing to the login page.
  await dashboardPage.goto();
  await expect(loginPage.heading).toBeHidden();

  await page.context().storageState({ path: STORAGE_STATE });
});

/** Opens the dashboard with the saved session and checks it is not sent back to the login page. */
async function isSavedSessionValid(browser: import('@playwright/test').Browser): Promise<boolean> {
  if (!fs.existsSync(STORAGE_STATE)) return false;
  const state = JSON.parse(fs.readFileSync(STORAGE_STATE, 'utf8'));
  if (!state.cookies?.length && !state.origins?.length) return false;

  const context = await browser.newContext({ storageState: STORAGE_STATE, baseURL: env.baseUrl });
  try {
    const page = await context.newPage();
    await page.goto('dashboard');
    const loginPage = new LoginPage(page);
    // Give the app a moment to redirect to the login page if the session has expired.
    return await loginPage.heading
      .waitFor({ timeout: 5_000 })
      .then(() => false)
      .catch(() => true);
  } finally {
    await context.close();
  }
}
