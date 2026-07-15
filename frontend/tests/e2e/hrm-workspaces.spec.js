import { test, expect } from '@playwright/test';

async function login(page, email) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

function captureErrors(page) {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.describe('professional HRM workspaces', () => {
  test('admin can open every operational workspace without runtime errors', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');
    const errors = captureErrors(page);

    await login(page, 'admin@gmail.com');

    for (const [path, title] of [
      ['/talent', 'Talent & Lifecycle'],
      ['/employee-services', 'Employee Services'],
      ['/operations', 'Operations Center'],
      ['/compensation', 'Compensation'],
      ['/administration', 'HR Administration'],
      ['/documents', 'Employee Documents'],
      ['/notifications', 'Notifications'],
      ['/my-hr', 'My HR'],
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await page.screenshot({ path: 'test-results/admin-workspaces.png', fullPage: true });
    expect(errors).toEqual([]);
  });

  test('admin can open key forms and action surfaces', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop');
    const errors = captureErrors(page);

    await login(page, 'admin@gmail.com');

    await page.goto('/employees/create');
    await expect(page.getByRole('heading', { name: 'Add Employee', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/tasks/create');
    await expect(page.getByRole('heading', { name: 'Create Task', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/payrolls');
    await expect(page.getByRole('heading', { name: 'Payroll', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payroll Register', exact: true })).toBeVisible();

    await page.goto('/documents');
    await page.getByRole('button', { name: /upload/i }).click();
    await expect(page.getByRole('heading', { name: 'Upload Document', exact: true })).toBeVisible();

    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: 'Notification Inbox', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    expect(errors).toEqual([]);
  });

  test('employee self service is responsive and hides administrative navigation', async ({ page }) => {
    const errors = captureErrors(page);

    await login(page, 'employee@gmail.com');
    await page.goto('/my-hr');

    await expect(page.getByRole('heading', { name: 'My HR', exact: true })).toBeVisible();
    await expect(page.getByText('Compensation', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Administration', { exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await page.goto('/my-attendance');
    await expect(page.getByRole('heading', { name: 'My Attendance', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.screenshot({ path: `test-results/my-hr-${test.info().project.name}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
});
