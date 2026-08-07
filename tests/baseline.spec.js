import { test, expect } from '@playwright/test';

/**
 * Baseline rehearsal tests for the Family Lab hub.
 *
 * These verify that every app renders without crashing and that the
 * Family Hub "not configured" screen only appears when expected.
 */

test.describe('Hub entrypoint', () => {
  test('index.html renders and links to all apps', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Family Lab');
    await expect(page.locator('a[href*="apps/family-hub"]')).toBeVisible();
    await expect(page.locator('a[href*="apps/presentation"]')).toBeVisible();
    await expect(page.locator('a[href*="apps/studio"]')).toBeVisible();
  });
});

test.describe('Family Hub', () => {
  test('renders without the unconfigured fallback on a local build with config', async ({ page }) => {
    // This test assumes the local config has been generated. When run in CI,
    // the workflow generates it before running tests.
    await page.goto('/apps/family-hub/');
    await page.waitForLoadState('networkidle');

    const notConfigured = page.locator('text=Family Hub not configured');
    await expect(notConfigured).toHaveCount(0);

    // The auth card or today view should be visible.
    await expect(page.locator('h2').first()).toContainText(/Welcome to Family Hub|Hari Ini|Today/);
  });

  test('service worker registers and reports a cache name', async ({ page }) => {
    await page.goto('/apps/family-hub/');
    await page.waitForLoadState('networkidle');

    // Wait for the registration to settle.
    await page.waitForFunction(() =>
      navigator.serviceWorker?.getRegistration().then(r => !!r?.active)
    );

    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const reg = await navigator.serviceWorker.getRegistration();
      return {
        supported: true,
        active: reg?.active?.scriptURL || null,
        scope: reg?.scope || null,
      };
    });
    expect(swState.supported).toBe(true);
    expect(swState.active).toContain('service-worker.js');
  });
});

test.describe('Deckmate', () => {
  test('renders the deck list screen', async ({ page }) => {
    await page.goto('/apps/presentation/');
    await expect(page.locator('h1')).toContainText(/Deckmate/);
  });
});

test.describe('Studio', () => {
  test('renders the landing or auth screen', async ({ page }) => {
    await page.goto('/apps/studio/');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1').first();
    await expect(heading).toContainText(/Studio|Sign in|Log in/);
  });
});
