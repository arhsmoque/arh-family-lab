// Family Hub — smoke test: loads and shows auth/setup UI without errors
const { chromium } = require('playwright');

(async () => {
  const server = require('child_process').spawn('python', ['-m', 'http.server', '4174'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:4174/apps/family-hub/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify we land on the auth screen when not signed in
  const authHeading = await page.locator('text=Welcome to Family Hub').isVisible().catch(() => false);
  const notConfigured = await page.locator('text=Family Hub not configured').isVisible().catch(() => false);

  await browser.close();
  server.kill();

  if (errors.length > 0) {
    console.error('Console errors found:');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  if (!authHeading && !notConfigured) {
    console.error('Expected auth screen or not-configured screen was not visible.');
    process.exit(1);
  }

  console.log('Smoke test passed: no console errors, initial screen rendered correctly.');
})();
