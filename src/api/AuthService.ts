import type { APIResponse } from '@playwright/test';
import type { ApiClient } from './ApiClient';

export interface LoginResponse {
  status: string;
  msg?: string;
}

/** /uiapi/auth endpoints. The login body is { userid, pass }, as the admin UI sends it. */
export class AuthService {
  constructor(private readonly api: ApiClient) {}

  /** Returns the raw response so tests can assert on both success and failure. */
  async login(userid: string, pass: string): Promise<APIResponse> {
    return this.api.post('auth/login', { userid, pass });
  }
}
