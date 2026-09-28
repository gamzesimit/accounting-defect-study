import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.AK_EMAIL ?? 'qa@test.local';
const PASSWORD = process.env.AK_PASSWORD ?? 'QaLocal123!';

/**
 * A tax rate is a number the whole ledger depends on. These checks ask whether
 * the form refuses the values that would corrupt every invoice built on them.
 */
test.describe('Tax rate validation', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(EMAIL, PASSWORD);
    await page.goto('/1/settings/taxes/create');
    await page.waitForLoadState('networkidle');
    test.skip(
      !page.url().includes('/settings/taxes/create'),
      'the create screens are blocked, see AK-001',
    );
  });

  async function save(page: any, name: string, rate: string) {
    const responses: number[] = [];
    page.on('response', (r: any) => {
      if (r.request().method() === 'POST' && r.url().includes('/settings/taxes'))
        responses.push(r.status());
    });
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="rate"]', rate);
    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await page.waitForTimeout(3000);
    return responses[0];
  }

  test('a valid rate is accepted', async ({ page }) => {
    const unique = Date.now().toString().slice(-6);
    const status = await save(page, `Sales Tax ${unique}`, '8.25');
    expect(status, 'a normal rate must save').toBe(200);
  });

  test('a negative rate is refused', async ({ page }) => {
    const unique = Date.now().toString().slice(-6);
    const status = await save(page, `Negative ${unique}`, '-5');
    expect(status, 'a negative tax rate must not be accepted').not.toBe(200);
  });

  test('a rate above one hundred per cent is refused', async ({ page }) => {
    const unique = Date.now().toString().slice(-6);
    const status = await save(page, `Over ${unique}`, '250');
    expect(status, 'a rate above one hundred per cent must not be accepted').not.toBe(200);
  });

  test('a rate that is not a number is refused', async ({ page }) => {
    const unique = Date.now().toString().slice(-6);
    const status = await save(page, `Text ${unique}`, 'abc');
    expect(status, 'a rate that is not a number must not be accepted').not.toBe(200);
  });
});
