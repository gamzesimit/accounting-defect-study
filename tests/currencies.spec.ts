import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.AK_EMAIL ?? 'qa@test.local';
const PASSWORD = process.env.AK_PASSWORD ?? 'QaLocal123!';

/**
 * A currency rate multiplies every figure converted through it, so a rate the
 * form should never accept is worth more than one that is merely unusual.
 */
test.describe('Currency validation', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(EMAIL, PASSWORD);
    await page.goto('/1/settings/currencies/create');
    await page.waitForLoadState('networkidle');
    test.skip(
      !page.url().includes('/settings/currencies/create'),
      'the create screens are blocked, see AK-001',
    );
  });

  async function save(page: any, code: string, rate: string) {
    const responses: number[] = [];
    page.on('response', (r: any) => {
      if (r.request().method() === 'POST' && r.url().includes('/settings/currencies'))
        responses.push(r.status());
    });
    await page.fill('input[name="name"]', `Test ${code}`);
    await page.fill('input[name="rate"]', rate);
    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await page.waitForTimeout(3000);
    return responses[0];
  }

  test('a rate of zero is refused', async ({ page }) => {
    const status = await save(page, 'ZER', '0');
    expect(status, 'a rate of zero would make every converted figure zero').not.toBe(200);
  });

  test('a negative rate is refused', async ({ page }) => {
    const status = await save(page, 'NEG', '-1.5');
    expect(status, 'a negative rate would flip the sign of every converted figure').not.toBe(200);
  });

  test('a rate that is not a number is refused', async ({ page }) => {
    const status = await save(page, 'TXT', 'abc');
    expect(status, 'a rate that is not a number must not be stored').not.toBe(200);
  });
});
