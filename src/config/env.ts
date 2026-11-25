import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads `config/.env.<TEST_ENV>` (default: qa), then a local `.env` for overrides
 * and secrets. Values that are already in the environment (for example, set by CI) always win.
 */
const testEnv = process.env.TEST_ENV ?? 'qa';
const envFile = path.resolve(__dirname, `../../config/.env.${testEnv}`);
if (!fs.existsSync(envFile)) {
  throw new Error(`Environment file not found for TEST_ENV="${testEnv}": ${envFile}`);
}
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: envFile });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  name: testEnv,
  isCI: !!process.env.CI,
  baseUrl: required('BASE_URL'),
  apiUrl: required('API_URL'),
  /** CI machines have no display, so CI is always headless. */
  headless: !!process.env.CI || optional('HEADLESS', 'true') !== 'false',
  users: {
    standard: {
      username: optional('STANDARD_USER'),
      password: optional('STANDARD_PASSWORD'),
    },
    admin: {
      username: optional('ADMIN_USER'),
      password: optional('ADMIN_PASSWORD'),
    },
  },
  /** Microsoft Entra ID single sign-on ("Sign in with Airaone" button). */
  sso: {
    username: optional('SSO_USER'),
    /** Optional. When empty, a headed run waits for you to type the password and approve MFA. */
    password: optional('SSO_PASSWORD'),
    /** How long to wait for a manual sign-in in the browser. */
    manualTimeoutMs: Number(optional('SSO_MANUAL_TIMEOUT_MS', '180000')),
  },
  /**
   * Use an installed browser ('chrome' or 'msedge') for the Chromium tests instead of
   * Playwright's bundled build. Needed where Windows Application Control blocks the bundled build.
   */
  browserChannel: optional('BROWSER_CHANNEL') || undefined,
  /** Slows every browser action by this many ms; useful for watching a headed run. */
  slowMo: Number(optional('SLOW_MO', '0')),
  apiToken: optional('API_TOKEN'),
} as const;

/** True when SSO_USER is set. Setup then signs in through Microsoft instead of the email/password form. */
export function hasSso(): boolean {
  return !!env.sso.username;
}

export type UserRole = keyof typeof env.users;

/** True when the app can be logged into for UI tests, by email/password form or by SSO. */
export function canLogIn(): boolean {
  return hasCredentials('standard') || hasSso();
}

/** True when a role's email/password form login is configured. Tests that need it skip when it is false. */
export function hasCredentials(role: UserRole = 'standard'): boolean {
  return !!(env.users[role].username && env.users[role].password);
}
