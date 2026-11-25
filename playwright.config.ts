import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { STORAGE_STATE } from './src/config/constants';

export default defineConfig({
  testDir: './tests',
  outputDir: 'reports/test-results',
  // Run tests one at a time, in file order. Sign out can end the shared SSO session,
  // so parallel logged-in tests are unreliable. Override for one run with --workers=4.
  fullyParallel: false,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['json', { outputFile: 'reports/json/results.json' }],
  ],

  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    launchOptions: { slowMo: env.slowMo },
  },

  projects: [
    // Logs in once and saves the session for the UI projects.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: env.browserChannel },
    },

    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], channel: env.browserChannel, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testDir: './tests/ui',
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiUrl },
    },
  ],
});
