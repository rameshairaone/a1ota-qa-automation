import type { Locator, Page } from '@playwright/test';

/** Sidebar links, keyed by label; values are paths relative to BASE_URL (/admin/). */
export const NAV_ITEMS = {
  Dashboard: 'dashboard',
  Workflows: 'workflows',
  Entities: 'entities',
  Libraries: 'custom_libraries',
  Policies: 'policies',
  Connections: 'connections',
  Secrets: 'secrets',
  Logs: 'logs',
  Settings: 'settings',
  IGA: 'iga',
} as const;

export type NavItem = keyof typeof NAV_ITEMS;

/** Left navigation sidebar shared by every admin page; holds the signed-in user and Sign out. */
export class SidebarComponent {
  readonly root: Locator;
  readonly signOutButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('navigation');
    this.signOutButton = this.root.getByRole('button', { name: /sign out/i });
  }

  /** Link text includes a Material icon name (e.g. "dashboard Dashboard"), so match the end. */
  link(item: NavItem): Locator {
    return this.root.getByRole('link', { name: new RegExp(`${item}$`) });
  }

  /** The signed-in user's email address shown above Sign out. */
  userEmail(email: string): Locator {
    return this.root.getByText(email);
  }

  async navigateTo(item: NavItem): Promise<void> {
    await this.link(item).click();
    await this.page.waitForURL(new RegExp(`/admin/${NAV_ITEMS[item]}`));
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }
}
