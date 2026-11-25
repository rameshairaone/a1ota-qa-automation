import type { Locator, Page } from '@playwright/test';

/** Top banner: product name and theme toggle. */
export class HeaderComponent {
  readonly root: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('banner');
    this.themeToggle = this.root.getByRole('button', { name: 'Toggle theme' });
  }
}
