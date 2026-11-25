import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '@components/HeaderComponent';
import { SidebarComponent } from '@components/SidebarComponent';

/** Admin dashboard at /admin/dashboard ("System Diagnostics"). */
export class DashboardPage extends BasePage {
  protected readonly path = 'dashboard';

  readonly header: HeaderComponent;
  readonly sidebar: SidebarComponent;
  readonly heading: Locator;
  readonly refreshButton: Locator;
  readonly autoPollCheckbox: Locator;
  readonly apiRouteSearch: Locator;
  readonly apiRoutesTable: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.sidebar = new SidebarComponent(page);
    const main = page.getByRole('main');
    this.heading = main.getByRole('heading', { name: 'System Diagnostics' });
    this.refreshButton = main.getByRole('button', { name: 'refresh' });
    this.autoPollCheckbox = main.getByRole('checkbox');
    this.apiRouteSearch = main.getByRole('textbox', { name: 'Search API routes...' });
    this.apiRoutesTable = main.getByRole('table');
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor();
  }

  /** Data rows of the API Metering table (header row excluded). */
  get apiRouteRows(): Locator {
    // The hasNot locator is matched inside each row, so build it from the page, not the table.
    return this.apiRoutesTable.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }
}
