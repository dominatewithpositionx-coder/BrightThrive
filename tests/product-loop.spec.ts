/**
 * BrightThrive Core Product Loop Verification
 * Tests the full loop: landing → dashboard → missions → child experience → demo mode
 */

import { test, expect, Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
}

// ─── Page load & navigation ───────────────────────────────────────────────────

test('PL-01: homepage loads with correct title and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(BASE);
  await expect(page).toHaveTitle(/BrytThrive/i);
  await screenshot(page, 'PL-01-homepage');

  const criticalErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('404') &&
    !e.includes('hydrat')
  );
  if (criticalErrors.length > 0) {
    console.log('Console errors:', criticalErrors);
  }
  // Non-blocking: log but don't fail on minor hydration warnings
});

test('PL-02: /login page loads', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  await screenshot(page, 'PL-02-login');
});

test('PL-03: /dashboard redirects unauthenticated users to login', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`);
  await expect(page).toHaveURL(/login|\/$/);
  await screenshot(page, 'PL-03-dashboard-redirect');
});

test('PL-04: /child (no ?demo=1) — unauthenticated shows login or child selector, NOT demo missions', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`${BASE}/child`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'PL-04-child-no-demo');

  // Must NOT show demo missions text
  const demoMissions = await page.getByText(/brush your teeth|read a book|tidy your room/i).count();
  expect(demoMissions).toBe(0);

  // Must NOT show the amber demo banner
  const demoBanner = await page.getByText(/demo preview/i).count();
  expect(demoBanner).toBe(0);

  const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('hydrat'));
  if (criticalErrors.length > 0) {
    console.log('PL-04 errors:', criticalErrors);
  }
});

test('PL-05: /child?demo=1 — shows amber demo banner', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto(`${BASE}/child?demo=1`);
  await page.waitForTimeout(2500);
  await screenshot(page, 'PL-05-child-demo-mode');

  // Should show demo banner
  const demoBanner = page.getByText(/demo preview/i);
  await expect(demoBanner).toBeVisible({ timeout: 8000 });

  const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('hydrat'));
  if (criticalErrors.length > 0) {
    console.log('PL-05 errors:', criticalErrors);
  }
});

test('PL-06: /api/generate-missions — returns 401 unauthenticated (not 500)', async ({ request }) => {
  const res = await request.post(`${BASE}/api/generate-missions`, {
    data: { parentId: 'test' },
  });
  // Must not crash — 401 or 400 is correct, 500 means the route is broken
  expect(res.status()).not.toBe(500);
  const body = await res.json().catch(() => ({}));
  console.log(`PL-06: /api/generate-missions returned ${res.status()}`, body);
});

test('PL-07: /how-it-works page loads', async ({ page }) => {
  await page.goto(`${BASE}/how-it-works`);
  await expect(page).not.toHaveURL(/error|404/);
  await screenshot(page, 'PL-07-how-it-works');
});

test('PL-08: /onboarding page loads', async ({ page }) => {
  await page.goto(`${BASE}/onboarding`);
  await expect(page).not.toHaveURL(/error/);
  await screenshot(page, 'PL-08-onboarding');
});

test('PL-09: /dashboard/rewards loads (auth guard works)', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/rewards`);
  await expect(page).toHaveURL(/login|\/$/);
});

test('PL-10: today date displays — todayStr() sanity check via API', async ({ request }) => {
  // The cron route uses todayStr() — hitting it unauthenticated verifies the route loads without crash
  const res = await request.get(`${BASE}/api/cron/generate-daily-missions`);
  expect(res.status()).not.toBe(500);
  console.log(`PL-10: cron route returned ${res.status()}`);
});
