import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.AK_EMAIL ?? 'qa@test.local';
const PASSWORD = process.env.AK_PASSWORD ?? 'QaLocal123!';

/**
 * AK-002. The email field is validated against live mail records for the
 * domain, which is not stated anywhere in the interface. A syntactically
 * correct address on a domain without mail records is rejected with a message
 * that says the address itself is wrong.
 */
test.describe('AK-002 email validation', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(EMAIL, PASSWORD);
  });

  test('a syntactically valid address on a reserved domain is accepted', async ({ page }) => {
    test.fail(); // AK-002
    await page.goto('/1/sales/customers/create');
    await page.waitForTimeout(3000);
    await page.fill('input[name="name"]', 'Example Customer');
    await page.fill('input[name="email"]', 'billing@example.com');

    const responses: number[] = [];
    page.on('response', (r) => {
      if (r.request().method() === 'POST' && r.url().includes('/sales/customers')) responses.push(r.status());
    });

    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await page.waitForTimeout(4000);
    expect(responses[0], 'example.com is reserved for documentation and is a valid address').toBe(200);
  });

  test('an address on a domain with live mail records is accepted', async ({ page }) => {
    await page.goto('/1/sales/customers/create');
    await page.waitForTimeout(3000);
    const unique = Date.now().toString().slice(-8);
    await page.fill('input[name="name"]', `Gmail Customer ${unique}`);
    await page.fill('input[name="email"]', `qa.reference.${unique}@gmail.com`);
    await page.getByRole('button', { name: 'Save', exact: true }).first().click();
    await page.waitForTimeout(4000);
    expect(page.url()).toMatch(/sales\/customers\/\d+/);
  });
});
