import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/**
 * Flow-of-events rehearsals for the Family Lab apps.
 *
 * These tests exercise the rendered UI the way a real user would, per the
 * flow-of-events-first checklist. They are intentionally not unit tests:
 * they click, type, and watch the screen.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function derivePinHash(pin, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Buffer.from(bits).toString('hex');
}

function makeSession(email = 'test@family.lab') {
  return {
    uid: 'test-user-1',
    email,
    idToken: 'test-token',
    refreshToken: 'test-refresh',
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}

async function seedFamilyHubState(page, opts = {}) {
  const household = {
    meta: {
      name: 'Test Household',
      ownerUid: 'test-user-1',
      ownerEmail: 'test@family.lab',
      createdAt: Date.now(),
    },
    members: {
      m_1: { id: 'm_1', name: 'Aisyah', role: 'child', avatar: '🧒', color: '#3B82F6', order: 0, createdAt: Date.now() },
      m_2: { id: 'm_2', name: 'Ibu', role: 'adult', avatar: '👩', color: '#EC4899', order: 1, createdAt: Date.now() },
    },
    tasks: {
      t_1: { id: 't_1', memberId: 'm_1', title: 'Pack school bag', category: 'morning', priority: 'medium', completed: false, createdAt: Date.now(), updatedAt: Date.now() },
    },
    checklists: {},
    events: {},
    config: { activeTheme: 'warm', lang: 'en', autoLockSeconds: 120 },
  };
  const session = opts.session || makeSession();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await derivePinHash('1234', salt);
  await page.evaluate(({ household, session, salt, hash }) => {
    localStorage.setItem('familyHub_state_v2', JSON.stringify(household));
    localStorage.setItem('familyHub_session_v1', JSON.stringify(session));
    localStorage.setItem('familyHub_pin_v1', JSON.stringify({ salt, hash }));
    localStorage.setItem('familyHub_pin_rate_v1', JSON.stringify({ attempts: 0, lockedUntil: 0 }));
  }, { household, session, salt, hash });
}

async function clickPinKeys(page, pin) {
  for (const digit of String(pin)) {
    await page.locator(`#pinModal .pin-key[data-val="${digit}"]`).click();
  }
}

// ---------------------------------------------------------------------------
// Deckmate — student/teacher flow
// ---------------------------------------------------------------------------

test.describe('Deckmate', () => {
  test('create a deck, add a slide, and enter present mode', async ({ page }) => {
    await page.goto('/apps/presentation/');
    await expect(page.locator('h1')).toContainText('Deckmate');

    // Create a new deck
    await page.getByRole('button', { name: /New deck/i }).click();
    await expect(page.locator('.ui-modal')).toBeVisible();
    await page.locator('.ui-modal-input').fill('Science Fair');
    await page.locator('.ui-modal button[data-role="confirm"]').click();

    // Editor opens with the new deck
    await expect(page.locator('#deckTitleInput')).toHaveValue('Science Fair');

    // Add a slide from the template picker
    await page.locator('#btnAddSlide').click();
    await expect(page.locator('#templateModal')).toBeVisible();
    await page.locator('.template-option').first().click();

    // Slide strip shows the new slide
    await expect(page.locator('.slide-thumb')).toHaveCount(1);

    // Enter present mode
    await page.getByRole('button', { name: /Present/i }).click();
    await expect(page.locator('#presentOverlay')).toBeVisible();
    await expect(page.locator('#presentCounter')).toContainText('1 / 1');

    // Exit present mode
    await page.locator('#btnExitPresent').click();
    await expect(page.locator('#presentOverlay')).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// Family Hub — family member + parent flow
// ---------------------------------------------------------------------------

test.describe('Family Hub', () => {
  test('loads the household, shows tasks, and unlocks parent mode', async ({ page }) => {
    // Seed local state on the same origin, then boot the app.
    await page.goto('/');
    await seedFamilyHubState(page);

    await page.goto('/apps/family-hub/');
    await page.waitForLoadState('networkidle');

    // Today view should render from cache
    await expect(page.locator('#viewContainer')).toContainText("TODAY'S TASKS");
    await expect(page.locator('#viewContainer')).toContainText('Pack school bag');

    // Switch to Family tab
    await page.locator('.nav-item[data-tab="family"]').click();
    await expect(page.locator('#viewContainer')).toContainText('Aisyah');
    await expect(page.locator('#viewContainer')).toContainText('Ibu');

    // Unlock parent mode (auto-submits after 4 digits)
    await page.locator('#btnUnlockParent').click();
    await expect(page.locator('#pinModal')).toHaveClass(/active/);
    await clickPinKeys(page, '1234');

    // Parent view is now active
    await expect(page.locator('.nav-item[data-tab="parent"]')).toHaveClass(/active/);
    await expect(page.locator('#viewContainer')).toContainText('Settings');
  });
});

// ---------------------------------------------------------------------------
// Studio — returning user flow (Firebase calls mocked)
// ---------------------------------------------------------------------------

test.describe('Studio', () => {
  test('loads the landing view for a returning user', async ({ page }) => {
    // Avoid real Firebase auth/DB calls in this rehearsal.
    await page.route('https://arh-firebase-db-default-rtdb.asia-southeast1.firebasedatabase.app/**', route => {
      route.fulfill({ status: 200, body: 'null' });
    });

    await page.goto('/');
    await page.evaluate(({ session }) => {
      localStorage.setItem('arh-studio-session-v1', JSON.stringify(session));
    }, { session: makeSession('studio@family.lab') });

    await page.goto('/apps/studio/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#view-landing')).toBeVisible();
    await expect(page.locator('#landingAlias')).toContainText('studio');
    await expect(page.locator('#view-landing')).toContainText('Your projects');
  });
});

// ---------------------------------------------------------------------------
// Kids Terminal — cadet prompt + visual widget flow
// ---------------------------------------------------------------------------

async function startKidsServer() {
  const cwd = path.resolve('servers', 'kids-terminal');
  // Clear any stale lock so the server can start.
  try { fs.unlinkSync(path.join(cwd, 'server.lock')); } catch {}

  const proc = spawn('node', ['server.js'], {
    cwd,
    env: {
      ...process.env,
      AGY_MOCK_MODE: '1',
      AGY_TEST_MODE: '1',
      SERVER_PORT: '0',
    },
  });

  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Kids Terminal server did not start in time')), 15000);

    const onData = (data) => {
      const text = data.toString();
      output += text;
      console.log('[kids-server]', text.trim());
      const match = output.match(/Local:\s+http:\/\/localhost:(\d+)\/servers\/kids-terminal\//);
      if (match) {
        clearTimeout(timer);
        proc.stdout.off('data', onData);
        resolve(parseInt(match[1], 10));
      }
    };

    proc.stdout.on('data', onData);
    proc.stderr.on('data', (data) => console.error('[kids-server]', data.toString().trim()));
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return { proc, port, baseUrl: `http://localhost:${port}/servers/kids-terminal/` };
}

test.describe('Kids Terminal', () => {
  test.describe.configure({ mode: 'serial' });
  let kids;

  test.beforeAll(async () => {
    kids = await startKidsServer();
  });

  test.afterAll(() => {
    if (kids?.proc) kids.proc.kill();
  });

  test('cadet asks for a story and sees a visual widget', async ({ page }) => {
    await page.goto(kids.baseUrl);
    await page.waitForLoadState('networkidle');

    // Sign in with a cached session so the cadet can use the terminal.
    await page.evaluate(({ session }) => {
      localStorage.setItem('agy-terminal-session-v1', JSON.stringify(session));
    }, { session: makeSession('cadet@family.lab') });
    await page.reload();

    await expect(page.locator('#main-layout')).toBeVisible();
    await expect(page.locator('#mascot-bubble-title')).toContainText('Hello Cadet!');

    await page.locator('#prompt-input').fill('tell me a story');
    await page.locator('#btn-send').click();

    // Mock mode returns a canned story scene; the visual board should render it.
    await expect(page.locator('#visual-board .story-text')).toContainText('Magic Castle', { timeout: 10000 });
  });
});
