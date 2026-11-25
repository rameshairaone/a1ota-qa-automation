import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '@config/env';

/**
 * Parent class for all page objects. Holds the navigation and wait helpers
 * every page uses. Page objects describe pages; assertions belong in tests.
 */
export abstract class BasePage {
  /**
   * Path relative to BASE_URL, without a leading slash: 'dashboard', or './' for the root.
   * A leading "/" would resolve against the domain root and drop the /admin/ prefix.
   */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  /** Absolute URL of this page, for example https://host/admin/dashboard. */
  get url(): string {
    return new URL(this.path, env.baseUrl).href;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForLoaded();
  }

  /** Override to wait for something that signals the page is ready. */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Exact match on this page's URL; ignores a trailing slash, query string and hash. */
  async expectOnPage(): Promise<void> {
    const base = this.url.replace(/\/$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page).toHaveURL(new RegExp(`^${base}/?([?#].*)?$`));
  }

  protected async fill(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }
}
