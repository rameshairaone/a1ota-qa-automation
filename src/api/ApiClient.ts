import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { logger } from '@utils/logger';

type Query = Record<string, string | number | boolean>;

interface RequestOptions {
  params?: Query;
  headers?: Record<string, string>;
  /** Fail the test when the status code differs. */
  expectedStatus?: number;
}

/**
 * Thin wrapper around Playwright's APIRequestContext: one place for auth headers,
 * logging and status checks. Create one service class per resource on top of it
 * (see UserService).
 */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Accept: 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    };
  }

  private async handle(method: string, url: string, res: APIResponse, expectedStatus?: number) {
    logger.debug(`${method} ${url} -> ${res.status()}`);
    if (expectedStatus !== undefined) {
      expect(res.status(), `${method} ${url} returned: ${await res.text()}`).toBe(expectedStatus);
    }
    return res;
  }

  async get(url: string, opts: RequestOptions = {}) {
    const res = await this.request.get(url, { params: opts.params, headers: this.headers(opts.headers) });
    return this.handle('GET', url, res, opts.expectedStatus);
  }

  async post(url: string, data: unknown, opts: RequestOptions = {}) {
    const res = await this.request.post(url, { data, params: opts.params, headers: this.headers(opts.headers) });
    return this.handle('POST', url, res, opts.expectedStatus);
  }

  async put(url: string, data: unknown, opts: RequestOptions = {}) {
    const res = await this.request.put(url, { data, params: opts.params, headers: this.headers(opts.headers) });
    return this.handle('PUT', url, res, opts.expectedStatus);
  }

  async patch(url: string, data: unknown, opts: RequestOptions = {}) {
    const res = await this.request.patch(url, { data, params: opts.params, headers: this.headers(opts.headers) });
    return this.handle('PATCH', url, res, opts.expectedStatus);
  }

  async delete(url: string, opts: RequestOptions = {}) {
    const res = await this.request.delete(url, { params: opts.params, headers: this.headers(opts.headers) });
    return this.handle('DELETE', url, res, opts.expectedStatus);
  }
}
