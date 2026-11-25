import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '@config/env';

/**
 * Microsoft Entra ID sign-in (login.microsoftonline.com), reached from the
 * "Sign in with Airaone" button. Not a BasePage: it lives on another domain.
 */
export class MicrosoftLoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordHeading: Locator;
  /** Microsoft reuses this element id for Next, Sign in and Yes ("Stay signed in?"). */
  readonly primaryButton: Locator;
  readonly staySignedInHeading: Locator;
  /** "Your account or password is incorrect..." */
  readonly passwordError: Locator;

  constructor(private readonly page: Page) {
    this.passwordError = page.locator('#passwordError');
    this.emailInput = page.locator('input[name="loginfmt"]');
    this.passwordInput = page.locator('input[name="passwd"]');
    this.passwordHeading = page.getByRole('heading', { name: 'Enter password' });
    this.primaryButton = page.locator('#idSIButton9');
    this.staySignedInHeading = page.getByRole('heading', { name: 'Stay signed in?' });
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/login\.microsoftonline\.com/);
    await expect(this.emailInput).toBeVisible();
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.primaryButton.click();
    await expect(this.passwordInput).toBeVisible();
  }

  async enterPassword(password: string): Promise<void> {
    // Microsoft's slide animation between the email and password screens can reset the
    // field right after it is filled, so retry until the value sticks.
    await expect(async () => {
      await this.passwordInput.fill(password);
      await expect(this.passwordInput).toHaveValue(password, { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await this.primaryButton.click();
  }

  /**
   * Full sign-in. With a password, fills it in and answers "Stay signed in?".
   * Without one, waits up to SSO_MANUAL_TIMEOUT_MS for a person to finish in the
   * visible browser (password, MFA, any prompts). Resolves once back on the app.
   */
  async signIn(email: string, password?: string): Promise<void> {
    await this.enterEmail(email);

    const timeout = env.sso.manualTimeoutMs;
    if (password) {
      await this.enterPassword(password);
      console.log(`\n>>> Password submitted. If Microsoft asks for MFA, approve it (up to ${timeout / 1000}s).\n`);
    } else {
      console.log(`\n>>> Type the password and approve MFA in the browser window (up to ${timeout / 1000}s).\n`);
    }

    // "Stay signed in?" appears for some tenants; answer Yes whenever it shows up.
    this.staySignedInHeading
      .waitFor({ timeout })
      .then(() => this.primaryButton.click())
      .catch(() => {});

    // Done when the browser is back on the app; fail fast if Microsoft rejects the password.
    await Promise.race([
      this.page.waitForURL((url) => url.href.startsWith(env.baseUrl), { timeout }),
      this.passwordError.waitFor({ timeout }).then(async () => {
        throw new Error(`Microsoft rejected the sign-in: ${await this.passwordError.innerText()}`);
      }),
    ]);
  }
}
