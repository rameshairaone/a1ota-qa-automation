# a1ota-qa-automation

UI and API test automation built on **Playwright + TypeScript** for the A1OTA admin console.

| Environment | UI | API |
|---|---|---|
| qa | https://morningstar-a1.azurewebsites.net/admin/ | https://morningstar-a1.azurewebsites.net/uiapi/ |
| staging | TODO | TODO |

> **URL rule:** `BASE_URL` and `API_URL` end with `/`, and every path in page objects and services
> has **no** leading slash (`'dashboard'`, `'auth/login'`). A leading `/` resolves against the
> domain root and silently drops the `/admin/` or `/uiapi/` prefix.

## Architecture

```
tests (specs)  ──uses──▶  fixtures  ──build──▶  page objects / API services  ──use──▶  Playwright
                                                     │
                                       config (env)  ┘   utils, test data
```

- **Tests** describe behaviour and hold the assertions. They never construct objects themselves.
- **Fixtures** (`src/fixtures`) inject ready-made page objects and API services into each test.
- **Page objects** (`src/pages`) contain locators and actions for one page. **Components** (`src/components`) hold UI that several pages share, such as the header.
- **API layer** (`src/api`): `ApiClient` handles auth headers, logging and status checks. One service class per resource (for example, `AuthService` for `/uiapi/auth/*`) sits on top of it.
- **Config** (`src/config`) loads the environment's settings. Secrets come from `.env` or CI secrets and are never committed.

## Folder structure

```
config/                 .env.qa, .env.staging     per-environment URLs (no secrets)
src/
  config/               env.ts, constants.ts      typed environment settings
  pages/                BasePage + page objects
  components/           reusable UI pieces (HeaderComponent)
  api/                  ApiClient + resource services
  fixtures/index.ts     custom test fixtures (import { test, expect } from '@fixtures')
  utils/                logger, dataFactory (faker-based unique data)
  data/                 static JSON test data for data-driven tests
tests/
  auth.setup.ts         logs in once and saves the session to .auth/user.json
  ui/                   browser tests (chromium, firefox, webkit)
  api/                  API tests (no browser)
.github/workflows/      CI pipeline
reports/                HTML, JUnit, JSON reports, plus traces, screenshots and videos (git-ignored)
```

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env          # then fill in credentials
```

Set the real `BASE_URL` and `API_URL` in `config/.env.qa` and `config/.env.staging`.

## Single sign-on (Microsoft Entra ID)

The "Sign in with Airaone" button goes through Microsoft Entra ID (tenant `saiairaone`).
When `SSO_USER` is set in `.env`, `tests/auth.setup.ts` signs in by SSO instead of the email/password form:

- **`SSO_PASSWORD` set:** fully automatic (email, then password, then "Stay signed in?"). This only works for an account **without MFA**; ask IT for an MFA-excluded test account for CI.
- **`SSO_PASSWORD` empty:** run `npm run auth:sso`. A Chrome window opens with the email already filled in. Type the password and approve MFA within 3 minutes (`SSO_MANUAL_TIMEOUT_MS`). The session is saved to `.auth/user.json` and reused by every UI test.

If Windows blocks Playwright's bundled Chromium ("An Application Control policy has blocked this file"),
set `BROWSER_CHANNEL=chrome` (or `msedge`) in `.env` to use the installed browser.

## Running tests

| Command | What it does |
|---|---|
| `npm test` | All projects in the QA environment |
| `npm run test:smoke` / `test:regression` | Tests tagged `@smoke` or `@regression` |
| `npm run test:api` | API tests only |
| `npm run test:ui` | UI tests on all three browsers |
| `npm run test:headed` / `test:debug` | Run in a visible browser, or step through with the inspector |
| `npm run test:staging` | Run against staging (`TEST_ENV=staging`) |
| `npm run report` | Open the last HTML report |
| `npm run codegen` | Record locators with Playwright codegen |

## Conventions

- **Locators:** prefer `getByRole`, `getByLabel` or `getByTestId` (`data-testid`). Avoid XPath and brittle CSS selectors.
- **No hard waits:** never use `waitForTimeout`. Rely on auto-waiting and web-first assertions (`await expect(locator).toBeVisible()`). ESLint enforces this.
- **Assertions live in tests,** not in page objects. The one exception is helpers such as `expectOnPage()`.
- **Tags:** add `@smoke` or `@regression` to test titles.
- **Independent tests:** every test sets up its own data (`dataFactory`) and can run in parallel and in any order.
- **Authentication:** UI tests reuse the saved session. Tests that must start logged out call `test.use({ storageState: { cookies: [], origins: [] } })`.
  Tests that need a real login call `test.skip(!hasCredentials(), ...)`, so the suite still runs (and skips them) before `.env` is filled in.
- **Short-lived messages:** the login error banner ("Invalid Credentials!", `role="alert"`) disappears after about 3 seconds. Assert on it straight after the action, with no steps in between.

## Adding a new page

1. Create `src/pages/MyPage.ts` that extends `BasePage` and sets `path` (relative, for example `'users'` for `/admin/users`).
2. Register it in `src/fixtures/index.ts`.
3. Use it in a test: `test('...', async ({ myPage }) => { ... })`.

## CI

`.github/workflows/playwright.yml` runs a type check and lint, then runs each project in a matrix job and uploads the reports. Add `STANDARD_USER`, `STANDARD_PASSWORD`, `ADMIN_USER`, `ADMIN_PASSWORD` and `API_TOKEN` as repository secrets. You can start the workflow manually and choose the environment.

On failure, open the trace with `npx playwright show-trace reports/test-results/<test>/trace.zip`.
