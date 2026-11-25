import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** "Sign in to A1OTA" admin console login, served at /admin/. */
export class LoginPage extends BasePage {
  protected readonly path = './';

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly showPasswordButton: Locator;
  readonly submitButton: Locator;
  readonly ssoLink: Locator;
  readonly igaLink: Locator;
  /** "Invalid Credentials!" banner. It disappears after a few seconds, so assert on it right away. */
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sign in to A1OTA' });
    // Use role + name, not getByLabel(/password/), which also matches the "Show password" button.
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByRole('textbox', { name: /password/i });
    this.showPasswordButton = page.getByRole('button', { name: 'Show password' });
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.ssoLink = page.getByRole('link', { name: /sign in with airaone/i });
    this.igaLink = page.getByRole('link', { name: 'Sign in to IGA' });
    this.errorMessage = page.getByRole('alert');
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
  }

  /** Starts single sign-on; the browser moves to Microsoft (see MicrosoftLoginPage). */
  async startSso(): Promise<void> {
    await this.ssoLink.click();
    await this.page.waitForURL(/login\.microsoftonline\.com/);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.submitButton.click();
  }
}
