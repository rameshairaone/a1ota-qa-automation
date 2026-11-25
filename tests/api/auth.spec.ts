import { test, expect } from '@fixtures';
import { env, hasCredentials } from '@config/env';
import { dataFactory } from '@utils/dataFactory';

test.describe('Auth API: POST /uiapi/auth/login', () => {
  test('rejects an unknown user with 400 @smoke @negative', async ({ authService }) => {
    const res = await authService.login(dataFactory.unknownEmail(), dataFactory.password());

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ status: 'error', msg: 'incorrect userid or password' });
  });

  test('rejects a wrong password with 400 @regression @negative', async ({ authService }) => {
    test.skip(!hasCredentials('standard'), 'STANDARD_USER not set');
    const res = await authService.login(env.users.standard.username, dataFactory.password());

    expect(res.status()).toBe(400);
    expect((await res.json()).status).toBe('error');
  });

  test('accepts valid credentials @smoke @positive @needs-login', async ({ authService }) => {
    test.skip(!hasCredentials('standard'), 'STANDARD_USER / STANDARD_PASSWORD not set');
    const res = await authService.login(env.users.standard.username, env.users.standard.password);

    expect(res.ok()).toBe(true);
  });
});
