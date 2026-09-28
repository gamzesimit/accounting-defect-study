import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const EMAIL = process.env.AK_EMAIL ?? 'qa@test.local';
const PASSWORD = process.env.AK_PASSWORD ?? 'QaLocal123!';

const createRoutes = [
  { name: 'customer', path: '/1/sales/customers/create' },
  { name: 'item', path: '/1/common/items/create' },
  { name: 'invoice', path: '/1/sales/invoices/create' },
  { name: 'tax rate', path: '/1/settings/taxes/create' },
  { name: 'bank transaction', path: '/1/banking/transactions/create?type=income' },
];

test.describe('AK-001 every create screen must open', () => {
  test.fail(); // AK-001, holds on a fresh install with no outbound access

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(EMAIL, PASSWORD);
    await login.expectSignedIn();

    // If the documented workaround has been applied the defect is masked and
    // these tests have nothing to prove, so skip rather than report noise.
    await page.goto('/1/settings/taxes/create');
    await page.waitForLoadState('networkidle');
    test.skip(
      page.url().includes('/settings/taxes/create'),
      'the plan cache workaround is in place, so AK-001 cannot be observed',
    );
  });

  for (const route of createRoutes) {
    test(`the ${route.name} form opens instead of redirecting`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      expect(page.url(), `${route.path} must not redirect away from the form`).toContain(
        route.path.split('?')[0],
      );
    });
  }
});
