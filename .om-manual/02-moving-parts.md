# 2. arh-family-lab — the moving parts

_Each part of the project: what it does, why it matters to you, and where it lives._

## (project root)

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: .cloudflareignore, .gitignore, .gitmodules, .infisical.json, AGENTS.md, ARCHITECTURE.md, README.md, SECRETS.md, clinical.html, index.html, package.json, playwright.config.js, pnpm-lock.yaml, run-kids-terminal.bat, wrangler.jsonc.

### Where it lives

- `.cloudflareignore:1-6` — verbatim:

```text
node_modules/
**/node_modules/
servers/
.git/
.agents/
.claude/
```

- `.gitignore:1-17` — verbatim:

```text
.DS_Store
.wrangler/
node_modules/
*.lock
!pnpm-lock.yaml
server.lock
.env
.env.*
.playwright-cli/
test-results/
playwright-report/

# Studio app local config override, if ever used — never commit
apps/studio/studio.config.local.js

# Family Hub local config override — generated from infisical
apps/family-hub/family.config.local.js
```

- `.gitmodules:1-3` — verbatim:

```text
[submodule "apps/kids-grades-garden"]
	path = apps/kids-grades-garden
	url = https://github.com/arhsmoque/arh-kids-grades-garden.git
```

- `.infisical.json:1-5` — verbatim:

```json
{
	"workspaceId": "90b0e7ef-3f72-4ddb-b888-055e90e13dfa",
	"defaultEnvironment": "dev",
	"gitBranchToEnvironmentMapping": null
}
```

Other files in this part: `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `SECRETS.md`, `clinical.html`, `index.html`, `package.json`, `playwright.config.js`, `pnpm-lock.yaml`, `run-kids-terminal.bat`, `wrangler.jsonc`

## .agents

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: .agents/skills/arh-cloudflare-wrangler-deploy/SKILL.md, .agents/skills/arh-cloudflare-wrangler-deploy/assets/pages-deploy.yml.template, .agents/skills/arh-cloudflare-wrangler-deploy/assets/verify-deploy-unit.mjs, .agents/skills/arh-cloudflare-wrangler-deploy/assets/worker-deploy.yml.template, .agents/skills/arh-cloudflare-wrangler-deploy/assets/wrangler.pages.toml.template, .agents/skills/arh-cloudflare-wrangler-deploy/assets/wrangler.worker.toml.template, .agents/skills/arh-cloudflare-wrangler-deploy/references/known-pitfalls.md, .agents/skills/arh-cloudflare-wrangler-deploy/references/required-secrets.md, .agents/skills/arh-cloudflare-wrangler-deploy/references/supabase-ci-migration.md, .agents/skills/arh-cloudflare-wrangler-deploy/references/worker-from-script.md.

### Where it lives

- `.agents/skills/arh-cloudflare-wrangler-deploy/SKILL.md:1-40` — verbatim:

````markdown
---
name: arh-cloudflare-wrangler-deploy
description: "Deploy Cloudflare Pages and Workers from GitHub Actions using wrangler, with each deployable unit independent (path-filtered triggers, its own job) and zero local-machine dependency (auth only via GitHub Actions repo/environment secrets, never a locally-held wrangler login). Use when adding, wiring, or auditing a Cloudflare Pages or Workers deployment, standardizing CI/CD across ARH repos, converting a locally-triggered deploy into a remote/CI-only one, or wiring a background job as a scheduled Worker."
compatibility: "Requires read/write access to the target repository's .github/workflows and wrangler.toml files, and the ability to inspect or request the repo's GitHub Actions secrets (gh secret list / gh secret set)."
---

# Arh Cloudflare Wrangler Deploy

# ARH Cloudflare Wrangler Deploy

Stand up or extend a GitHub Actions -> Cloudflare deployment where every deployable unit — one
Pages app, each Worker — deploys independently and authenticates only with GitHub Actions secrets.
No unit ever depends on another unit's build succeeding, and no unit ever depends on a developer's
local machine holding a `wrangler login` session or an exported token.

## Core directive

One workflow file per deployable unit. Each workflow triggers only on changes under that unit's own
path, builds and deploys using `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from GitHub Actions
secrets, and fails fast with a clear diagnostic if those secrets are absent — never falls back to a
prompt, a cached local credential, or a silent no-op deploy.

```text
push to main (path-filtered)
→ checkout + install
→ build (app-specific)
→ verify Cloudflare secrets are present (fail fast, clear error, if not)
→ wrangler deploy (pages deploy | deploy), scoped to this unit only
```

## 1. Inventory existing deployable units

Before adding anything, find what already exists:

1. Every `wrangler.toml` / `wrangler.jsonc` in the repo (`git grep -l wrangler`), and whether each
   targets Pages (`pages_build_output_dir`) or a Worker (`main =`, `[triggers]`).
2. Every `.github/workflows/*.yml` that runs `wrangler`. Read each one fully — a working example in
   the repo is the pattern to generalize, not to replace.
3. `gh secret list` on the target repo to see which of `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`, and any app-specific secrets (Supabase URL/keys, API keys) already
````

- `.agents/skills/arh-cloudflare-wrangler-deploy/assets/pages-deploy.yml.template:1-40` — verbatim:

```text
name: Deploy <UNIT_NAME> to Cloudflare Pages

# Independent deploy unit. Triggers only on changes under <UNIT_PATH>/**, never blocked by or
# blocking any other unit's deploy. Dormant (fails fast, clearly) until CLOUDFLARE_API_TOKEN and
# CLOUDFLARE_ACCOUNT_ID exist as repository (or environment) secrets.

on:
  push:
    branches: [main]
    paths:
      - "<UNIT_PATH>/**"
  workflow_dispatch:

concurrency:
  group: deploy-<UNIT_NAME>
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build --workspace=<UNIT_NAME> # or your unit's actual build command
        env:
```

- `.agents/skills/arh-cloudflare-wrangler-deploy/assets/verify-deploy-unit.mjs:71-110` — verbatim:

```text
}

// prettier has no built-in parser for wrangler.toml (or other non-JS/TS/JSON/MD/YAML files) --
// passing one to --check fails with "No parser could be inferred", not a real formatting issue.
const PRETTIER_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".html"
]);

function splitByPrettierSupport(paths) {
  const supported = [];
  const unsupported = [];
  for (const path of paths) {
    const dot = path.lastIndexOf(".");
    const ext = dot === -1 ? "" : path.slice(dot).toLowerCase();
    (PRETTIER_EXTENSIONS.has(ext) ? supported : unsupported).push(path);
  }
  return { supported, unsupported };
}

function hasScript(name) {
  if (!existsSync("package.json")) return false;
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  return Boolean(pkg.scripts && pkg.scripts[name]);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = [];

```

- `.agents/skills/arh-cloudflare-wrangler-deploy/assets/worker-deploy.yml.template:1-40` — verbatim:

```text
name: Deploy <UNIT_NAME> to Cloudflare Workers

# Independent deploy unit. Triggers only on changes under <UNIT_PATH>/**, never blocked by or
# blocking any other unit's deploy. Dormant (fails fast, clearly) until CLOUDFLARE_API_TOKEN and
# CLOUDFLARE_ACCOUNT_ID exist as repository (or environment) secrets. The Worker's own runtime
# secrets (e.g. SUPABASE_SERVICE_ROLE_KEY) are set via `wrangler secret put` out-of-band, once,
# not passed through this workflow -- see references/required-secrets.md.

on:
  push:
    branches: [main]
    paths:
      - "<UNIT_PATH>/**"
  workflow_dispatch:

concurrency:
  group: deploy-<UNIT_NAME>
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Check Cloudflare credentials are configured
```

Other files in this part: `.agents/skills/arh-cloudflare-wrangler-deploy/assets/wrangler.pages.toml.template`, `.agents/skills/arh-cloudflare-wrangler-deploy/assets/wrangler.worker.toml.template`, `.agents/skills/arh-cloudflare-wrangler-deploy/references/known-pitfalls.md`, `.agents/skills/arh-cloudflare-wrangler-deploy/references/required-secrets.md`, `.agents/skills/arh-cloudflare-wrangler-deploy/references/supabase-ci-migration.md`, `.agents/skills/arh-cloudflare-wrangler-deploy/references/worker-from-script.md`

## .claude

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: .claude/skills/arh-universal-frontend-design/SKILL.md, .claude/skills/arh-universal-frontend-design/references/repo-profile.md.

### Where it lives

- `.claude/skills/arh-universal-frontend-design/SKILL.md:1-31` — verbatim:

```markdown
---
name: arh-universal-frontend-design
description: Use when designing, reviewing, redesigning, implementing, or quality-checking frontend interfaces in arh-family-lab.
---

# Universal Frontend Design — arh-family-lab

Shared quality is mandatory; shared visual themes are forbidden.

## Workflow

1. Read this repository's `AGENTS.md`, README, active UI entrypoint, stack/config, and verification commands.
2. Read [the repository profile](references/repo-profile.md).
3. State audience, job, dominant environment/device, primary action, and failure cost.
4. Choose the dominant archetype and one content-derived signature behavior before selecting palette, effects, libraries, or components.
5. Preserve repository contracts, state ownership, tokens, and stack. Name user-facing and operator-facing ports.
6. Implement the smallest coherent vertical slice with relevant empty, loading, error, offline, saving, and permission states.
7. Run repository gates plus responsive, keyboard/focus, touch, reduced-motion, security-boundary, and performance checks.

## Non-negotiables

- NEVER copy another ARH product's theme merely because it succeeded.
- NEVER style before understanding the audience and job.
- NEVER treat a polished happy path as complete.
- NEVER add a frontend dependency or rewrite the stack without necessity.
- STOP and restart discovery if critical states or accessible fallbacks are missing.

## Output contract

Report the archetype, signature behavior, files changed, commands/browser states verified, and residual risks. Done means the interface fits this product, remains distinct for defensible reasons, passes local gates, and leaves operator-visible evidence.

```

- `.claude/skills/arh-universal-frontend-design/references/repo-profile.md:1-10` — verbatim:

```markdown
# arh-family-lab frontend profile

- **Audience/job:** Children, family members, caregivers, and presenters with varied literacy, ability, devices, and confidence.
- **Dominant archetype:** Learning/onboarding and personal creation lab.
- **Signature behavior:** A visible what-happens-next cue appropriate to each small app; caregiver/presenter support where relevant.
- **Priorities:** Plain language; large targets; low memory burden; reduced motion; privacy-safe state; phone and projector layouts; non-clinical warmth.
- **Verification:** Run app-specific checks; smoke touch, keyboard, zoom, high contrast, empty/restart states, and projector readability.

This profile is context, not a theme preset. Live repository instructions and product evidence override stale assumptions.

```

## .github

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: .github/workflows/deploy-cloudflare-pages.yml, .github/workflows/pages.yml, .github/workflows/sync-secrets.yml.

### Where it lives

- `.github/workflows/deploy-cloudflare-pages.yml:1-40` — verbatim:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: cloudflare-pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - name: Verify Cloudflare credentials
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
            echo "::error::CLOUDFLARE_API_TOKEN secret is missing"
            exit 1
          fi
          if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
            echo "::error::CLOUDFLARE_ACCOUNT_ID secret is missing"
            exit 1
          fi
      - name: Build app local configs from secrets
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_URL: ${{ secrets.FIREBASE_URL }}
```

- `.github/workflows/pages.yml:1-40` — verbatim:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Build app local configs from secrets
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_URL: ${{ secrets.FIREBASE_URL }}
          FIREBASE_ROOT_FAMILY_HUB: ${{ secrets.FIREBASE_ROOT_FAMILY_HUB }}
          FIREBASE_ROOT_STUDIO: ${{ secrets.FIREBASE_ROOT_STUDIO }}
        run: |
          node scripts/build-family-hub-config.mjs
          node scripts/build-studio-config.mjs
      - name: Prepare deploy bundle
        run: |
          node scripts/prepare-deploy-bundle.mjs
          # Bump the Family Hub service worker cache name per deploy so every
          # push invalidates the old cache and the PWA auto-updates.
          sed -i "s/const CACHE_NAME = 'family-hub-v1';/const CACHE_NAME = 'family-hub-${{ github.sha }}';/" dist/apps/family-hub/service-worker.js
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
```

- `.github/workflows/sync-secrets.yml:1-37` — verbatim:

```yaml
name: Sync secrets from Infisical

on:
  workflow_dispatch:

concurrency:
  group: sync-secrets
  cancel-in-progress: true

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install CLIs
        run: |
          # GitHub CLI
          curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
          echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
          sudo apt-get update
          sudo apt-get install -y gh
          # Wrangler
          npm install -g wrangler
      - name: Sync to GitHub and Cloudflare
        env:
          INFISICAL_TOKEN: ${{ secrets.INFISICAL_TOKEN }}
          INFISICAL_CLIENT_ID: ${{ secrets.INFISICAL_CLIENT_ID }}
          INFISICAL_CLIENT_SECRET: ${{ secrets.INFISICAL_CLIENT_SECRET }}
          GH_TOKEN: ${{ secrets.GH_PAT }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: node scripts/sync-secrets.mjs
```

## apps

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: apps/family-hub/README.md, apps/family-hub/SETUP.md, apps/family-hub/app.css, apps/family-hub/app.js, apps/family-hub/core/audio-fx.js, apps/family-hub/core/audit-log.js, apps/family-hub/core/auth.js, apps/family-hub/core/db.js, apps/family-hub/core/pin-security.js, apps/family-hub/core/store.js, apps/family-hub/family.config.js, apps/family-hub/family.config.local.js, apps/family-hub/index.html, apps/family-hub/manifest.json, apps/family-hub/manifest.webmanifest, apps/family-hub/service-worker.js, apps/family-hub/shared-bridge.mjs, apps/family-hub/test/smoke.js, apps/kids-grades-garden/.firebaserc.example, apps/kids-grades-garden/.git, apps/kids-grades-garden/.github/workflows/ci.yml, apps/kids-grades-garden/.github/workflows/deploy.yml, apps/kids-grades-garden/.gitignore, apps/kids-grades-garden/.node-version, apps/kids-grades-garden/AGENTS.md, apps/kids-grades-garden/DESIGN.md, apps/kids-grades-garden/README.md, apps/kids-grades-garden/SETUP.md, apps/kids-grades-garden/database.rules.json, apps/kids-grades-garden/dev-journal.md, apps/kids-grades-garden/firebase.json, apps/kids-grades-garden/handoff.md, apps/kids-grades-garden/index.html, apps/kids-grades-garden/package.json, apps/kids-grades-garden/pnpm-workspace.yaml, apps/kids-grades-garden/public/app.js, apps/kids-grades-garden/public/firebase-config.js, apps/kids-grades-garden/public/firebase-rest.js, apps/kids-grades-garden/public/index.html, apps/kids-grades-garden/public/manifest.webmanifest, apps/kids-grades-garden/public/model.js, apps/kids-grades-garden/public/pin-lock.js, apps/kids-grades-garden/public/styles.css, apps/kids-grades-garden/public/sw.js, apps/kids-grades-garden/tests/database.rules.test.js, apps/kids-grades-garden/tests/model.test.js, apps/kids-grades-garden/wrangler.jsonc, apps/presentation/app.js, apps/presentation/deck-core.js, apps/presentation/deck-modules.js, apps/presentation/deckmate.config.js, apps/presentation/i18n.js, apps/presentation/index.html, apps/presentation/manifest.json, apps/presentation/slide-renderer.js, apps/presentation/storage-port.js, apps/presentation/style.css, apps/studio/SETUP.md, apps/studio/app.js, apps/studio/dev.html, apps/studio/dev.js, apps/studio/firebase-rest.js, apps/studio/index.html, apps/studio/manifest.json, apps/studio/shared-bridge.mjs, apps/studio/studio.config.js, apps/studio/studio.config.local.js, apps/studio/style.css.

### Where it lives

- `apps/family-hub/README.md:1-16` — verbatim:

```markdown
# Family Hub — Shared Household iPad Pilot

A shared, touch-first daily dashboard and task hub designed for household tablets and phones.

## Features

- **Today Dashboard**: Date/time, next activity countdown, family member avatar selector.
- **3-Tap Child Action**: Instant task completion with sound chimes and zero login friction.
- **Leaving-Home Checklists**: Quick checklists for school, sports, and family outings.
- **Parent PIN Mode**: 4-digit PIN lock (Default PIN: `1234`) for sensitive actions.
- **Bilingual**: Toggle between Bahasa Melayu and English.
- **No-Build Architecture**: Static HTML5/CSS/JS linking `shared/theme.css`.

## Setup

No build step required. Open `apps/family-hub/index.html` in any browser or launch via local HTTP server (`python3 -m http.server 4173`).
```

- `apps/family-hub/SETUP.md:1-40` — verbatim:

````markdown
# Family Hub — Firebase setup

Family Hub uses the same Firebase project as Studio and Agy Kids Terminal (`arh-firebase-db`), isolated under a `familyHub` root. One owner account per household.

## One-time console steps

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Realtime Database → Rules** → merge the rules below into your existing rules (add the `"familyHub"` key alongside `"studio"` and `"kids-terminal"`).
3. Generate `family.config.local.js` from infisical (see section below).

## Security model

- The **owner** signs in with a real Firebase Auth email/password.
- The household iPad is a **trusted device**: once the owner signs in, the app stays authenticated.
- **Parent mode** on the device is protected by a **local 4-digit PIN** (salted hash stored in `localStorage`, never in Firebase).
- If the PIN is forgotten, the owner signs out and signs in again with the email/password.
- Children are **profiles**, not accounts. They use the iPad directly without signing in.

## Rules — paste into Realtime Database → Rules

```json
{
  "rules": {
    "familyHub": {
      "households": {
        "$ownerUid": {
          ".read": "auth != null && auth.uid === $ownerUid",
          ".write": "auth != null && auth.uid === $ownerUid",
          "meta": {
            "ownerUid": { ".validate": "newData.val() === auth.uid" },
            "ownerEmail": { ".validate": "newData.val() === auth.token.email" }
          }
        }
      }
    }
  }
}
```

What this enforces: only the household owner can read or write their own household data. Children and guests have no database access — they interact only with the locally rendered data on the trusted device.
````

- `apps/family-hub/app.css:1-40` — verbatim:

```css
/* Family Hub Touch-First Stylesheet with Preset Visual Themes */
@import "../../shared/theme.css";

:root {
  --color-primary: #D97706;
  --color-primary-light: #FEF3C7;
  --color-bg: #FFFBEB;
  --color-surface: #FFFFFF;
  --color-card: #FFFFFF;
  --color-border: #FDE68A;
  --color-text-main: #1E293B;
  --color-text-muted: #64748B;
  --color-success: #10B981;
  --color-success-light: #ECFDF5;
  --color-warning: #F59E0B;
  --color-warning-light: #FFFBEB;
  --color-danger: #EF4444;
  --color-danger-light: #FEF2F2;

  --font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --touch-min-adult: 48px;
  --touch-min-child: 64px;
  --radius-lg: 16px;
```

- `apps/family-hub/app.js:1-40` — verbatim:

```javascript
// Family Hub — main application controller
(function () {
  'use strict';

  const store = window.FamilyHubStore;
  const auth = window.FamilyHubAuth;
  const security = window.FamilyHubSecurity;
  const audit = window.FamilyHubAudit;
  const audio = window.FamilyHubAudio;

  const state = {
    activeTab: 'today',
    selectedMemberId: null,
    pinInput: '',
    parentUnlocked: false,
    lang: localStorage.getItem('familyHub_lang') || 'en',
    idleTimer: null,
    lockTimer: null,
    session: null
  };

  // Surface fatal errors so the app never silently stops on a blank screen.
  window.addEventListener('error', e => {
    console.error('Unhandled error:', e.error);
    if (el.view && !el.view.innerHTML.trim()) {
      el.view.innerHTML = `
        <div class="card centered-card">
          <h2>😕 Something went wrong</h2>
          <p>${e.message || 'An unexpected error occurred.'}</p>
          <button class="btn-primary" onclick="location.reload()">Reload</button>
        </div>
      `;
      hideNav();
    }
  });
  window.addEventListener('unhandledrejection', e => {
    console.error('Unhandled rejection:', e.reason);
  });

  const i18n = {
```

Other files in this part: `apps/family-hub/core/audio-fx.js`, `apps/family-hub/core/audit-log.js`, `apps/family-hub/core/auth.js`, `apps/family-hub/core/db.js`, `apps/family-hub/core/pin-security.js`, `apps/family-hub/core/store.js`, `apps/family-hub/family.config.js`, `apps/family-hub/family.config.local.js`, `apps/family-hub/index.html`, `apps/family-hub/manifest.json`, `apps/family-hub/manifest.webmanifest`, `apps/family-hub/service-worker.js`, `apps/family-hub/shared-bridge.mjs`, `apps/family-hub/test/smoke.js`, `apps/kids-grades-garden/.firebaserc.example`, `apps/kids-grades-garden/.git`, `apps/kids-grades-garden/.github/workflows/ci.yml`, `apps/kids-grades-garden/.github/workflows/deploy.yml`, `apps/kids-grades-garden/.gitignore`, `apps/kids-grades-garden/.node-version`, `apps/kids-grades-garden/AGENTS.md`, `apps/kids-grades-garden/DESIGN.md`, `apps/kids-grades-garden/README.md`, `apps/kids-grades-garden/SETUP.md`, `apps/kids-grades-garden/database.rules.json`, `apps/kids-grades-garden/dev-journal.md`, `apps/kids-grades-garden/firebase.json`, `apps/kids-grades-garden/handoff.md`, `apps/kids-grades-garden/index.html`, `apps/kids-grades-garden/package.json`, `apps/kids-grades-garden/pnpm-workspace.yaml`, `apps/kids-grades-garden/public/app.js`, `apps/kids-grades-garden/public/firebase-config.js`, `apps/kids-grades-garden/public/firebase-rest.js`, `apps/kids-grades-garden/public/index.html`, `apps/kids-grades-garden/public/manifest.webmanifest`, `apps/kids-grades-garden/public/model.js`, `apps/kids-grades-garden/public/pin-lock.js`, `apps/kids-grades-garden/public/styles.css`, `apps/kids-grades-garden/public/sw.js`, `apps/kids-grades-garden/tests/database.rules.test.js`, `apps/kids-grades-garden/tests/model.test.js`, `apps/kids-grades-garden/wrangler.jsonc`, `apps/presentation/app.js`, `apps/presentation/deck-core.js`, `apps/presentation/deck-modules.js`, `apps/presentation/deckmate.config.js`, `apps/presentation/i18n.js`, `apps/presentation/index.html`, `apps/presentation/manifest.json`, `apps/presentation/slide-renderer.js`, `apps/presentation/storage-port.js`, `apps/presentation/style.css`, `apps/studio/SETUP.md`, `apps/studio/app.js`, `apps/studio/dev.html`, `apps/studio/dev.js`, `apps/studio/firebase-rest.js`, `apps/studio/index.html`, `apps/studio/manifest.json`, `apps/studio/shared-bridge.mjs`, `apps/studio/studio.config.js`, `apps/studio/studio.config.local.js`, `apps/studio/style.css`

## clinical

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: clinical/cpr-komuniti-v0/README.md, clinical/cpr-komuniti-v0/app.css, clinical/cpr-komuniti-v0/app.js, clinical/cpr-komuniti-v0/content.js, clinical/cpr-komuniti-v0/index.html, clinical/cpr-komuniti-v0/manifest.webmanifest, clinical/cpr-komuniti-v0/qrcode.js, clinical/cpr-komuniti-v0/sw.js, clinical/cpr-scenario-lab-v1/DESIGN.md, clinical/cpr-scenario-lab-v1/dist/assets/index-BBBtzUxn.css, clinical/cpr-scenario-lab-v1/dist/index.html, clinical/cpr-scenario-lab-v1/index.html, clinical/cpr-scenario-lab-v1/package-lock.json, clinical/cpr-scenario-lab-v1/package.json, clinical/cpr-scenario-lab-v1/src/App.jsx, clinical/cpr-scenario-lab-v1/src/index.css, clinical/cpr-scenario-lab-v1/src/main.jsx, clinical/cpr-scenario-lab-v1/vite.config.js, clinical/ecc-react-lab/.gitignore, clinical/ecc-react-lab/.oxlintrc.json, clinical/ecc-react-lab/README.md, clinical/ecc-react-lab/dist/assets/index-JbGoKzsM.css, clinical/ecc-react-lab/dist/favicon.svg, clinical/ecc-react-lab/dist/icons.svg, clinical/ecc-react-lab/dist/index.html, clinical/ecc-react-lab/index.html, clinical/ecc-react-lab/package-lock.json, clinical/ecc-react-lab/package.json, clinical/ecc-react-lab/public/favicon.svg, clinical/ecc-react-lab/public/icons.svg, clinical/ecc-react-lab/src/App.css, clinical/ecc-react-lab/src/App.jsx, clinical/ecc-react-lab/src/assets/react.svg, clinical/ecc-react-lab/src/assets/vite.svg, clinical/ecc-react-lab/src/components/BatikPattern.jsx, clinical/ecc-react-lab/src/components/BilingualCard.jsx, clinical/ecc-react-lab/src/components/Header.jsx, clinical/ecc-react-lab/src/components/MouthMap.jsx, clinical/ecc-react-lab/src/components/NavPills.jsx, clinical/ecc-react-lab/src/components/SectionExam.jsx, clinical/ecc-react-lab/src/components/SectionIntro.jsx, clinical/ecc-react-lab/src/components/SectionPrevention.jsx, clinical/ecc-react-lab/src/components/SectionRisk.jsx, clinical/ecc-react-lab/src/components/SectionTakeHome.jsx, clinical/ecc-react-lab/src/components/SectionTreatment.jsx, clinical/ecc-react-lab/src/components/ToothLab.jsx, clinical/ecc-react-lab/src/data/content.js, clinical/ecc-react-lab/src/index.css, clinical/ecc-react-lab/src/main.jsx, clinical/ecc-react-lab/vite.config.js, clinical/ecc-realistic-tooth-lab/index.html, clinical/ecc-tooth-lab-mouth-map/index.html, clinical/ecc-tooth-lab/index.html, clinical/presentation-design-studio/PORTS.md, clinical/presentation-design-studio/adapters.js, clinical/presentation-design-studio/app.js, clinical/presentation-design-studio/index.html, clinical/presentation-design-studio/studio-core.js, clinical/presentation-design-studio/style.css.

### Where it lives

- `clinical/cpr-komuniti-v0/README.md:1-12` — verbatim:

```markdown
# Community CPR v0

Preserved baseline release of the KKM community CPR adaptation in two coordinated formats:

- `index.html` — mobile-first interactive HTML guide
- `downloads/CPR-Komuniti-KKM-v0.pptx` — editable 19-slide projector presentation

The repository copy of the PPTX contains one deployment-specific change only: its closing QR points to the published v0 HTML URL. The original v0 task artifacts remain unchanged in the ARH deliverable folder.

Primary source: Kementerian Kesihatan Malaysia, *Manual CPR untuk Komuniti*, first edition 2019, MOH/P/PAK/418.19(HB)-e.

Educational material only. It does not replace accredited CPR training, organisational protocols, manikin practice, or emergency-dispatch instructions.
```

- `clinical/cpr-komuniti-v0/app.css:1-7` — verbatim:

```css
:root{--bg:#08131f;--panel:#102131;--panel2:#152b3f;--text:#f4f7fa;--muted:#a9b7c6;--red:#e23b3b;--coral:#ff6b5e;--cyan:#27c5d9;--green:#4ed49a;--amber:#ffc857;--line:#274158;--shadow:0 20px 60px #0005;--radius:24px;--max:1180px}
*{box-sizing:border-box}[hidden]{display:none!important}html{scroll-behavior:smooth;scroll-padding-top:88px}body{margin:0;background:radial-gradient(circle at 80% 0,#12334b 0,transparent 30%),var(--bg);color:var(--text);font-family:Aptos,"Segoe UI",Arial,sans-serif;line-height:1.5}a{color:inherit}.skip{position:fixed;left:1rem;top:-5rem;z-index:99;background:#fff;color:#000;padding:.7rem 1rem;border-radius:8px}.skip:focus{top:1rem}.topbar{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:.8rem max(1rem,calc((100vw - var(--max))/2));background:#08131fe8;backdrop-filter:blur(16px);border-bottom:1px solid #ffffff14}.brand{display:flex;align-items:center;gap:.65rem;text-decoration:none}.brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:var(--red);font-size:1.4rem}.brand b,.brand small{display:block;line-height:1}.brand small{margin-top:.25rem;color:var(--muted);font-size:.63rem;letter-spacing:.13em}.top-actions{display:flex;gap:.55rem;align-items:center}.ghost,.secondary,.primary,.call{border:1px solid var(--line);border-radius:999px;padding:.72rem 1rem;background:transparent;color:var(--text);font:inherit;font-weight:700;text-decoration:none;cursor:pointer}.primary,.call{background:var(--red);border-color:var(--red)}.secondary{background:#ffffff10}.compact{padding:.7rem 1rem}.page-section{max-width:var(--max);margin:0 auto;padding:clamp(3.5rem,7vw,7rem) 1.25rem}.hero{min-height:calc(100vh - 70px);display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(2rem,6vw,6rem);align-content:center;position:relative}.eyebrow{color:var(--cyan);font-size:.78rem;font-weight:800;letter-spacing:.16em}.hero h1,.section-heading h2,.handoff h2{margin:.5rem 0 1rem;font-size:clamp(2.8rem,7vw,6.8rem);line-height:.93;letter-spacing:-.055em}.hero h1 em{color:var(--coral);font-style:normal}.lede{max-width:680px;color:#d5dee6;font-size:clamp(1.05rem,2vw,1.35rem)}.hero-actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}.memory{display:grid;gap:.8rem}.memory>div{display:grid;grid-template-columns:50px 1fr;gap:.05rem 1rem;align-items:center;padding:1.1rem;border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,#fff08,#fff02)}.memory span{grid-row:1/3;color:var(--coral);font-size:1.6rem;font-weight:900}.memory b{font-size:1.15rem}.memory small{color:var(--muted)}.emergency-note{grid-column:1/-1;border-left:4px solid var(--amber);background:#ffc85712;padding:1rem 1.2rem;border-radius:4px 14px 14px 4px;color:#f8e8be}.module-nav{position:sticky;top:69px;z-index:20;display:flex;gap:.5rem;overflow:auto;padding:.75rem max(1rem,calc((100vw - var(--max))/2));background:#0b1926eb;backdrop-filter:blur(10px);border-block:1px solid #ffffff10}.module-nav a{white-space:nowrap;text-decoration:none;padding:.55rem .8rem;border-radius:999px;color:var(--muted);font-weight:700}.module-nav a:hover,.module-nav a:focus{background:#ffffff10;color:var(--text)}.module{border-bottom:1px solid #ffffff0f}.section-heading{display:grid;grid-template-columns:1fr minmax(260px,520px);gap:1rem 3rem;align-items:end}.section-heading .eyebrow{grid-column:1/-1;margin:0}.section-heading h2{font-size:clamp(2.4rem,5vw,5rem)}.section-heading>p:last-child{color:var(--muted);font-size:1.15rem}.step-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin-top:2.5rem}.step{position:relative;min-height:230px;padding:1.35rem;border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(145deg,#173149,#0d1d2b);box-shadow:var(--shadow)}.step-label{display:inline-grid;place-items:center;min-width:46px;height:46px;padding:0 .7rem;border-radius:13px;background:var(--accent,var(--coral));color:#07131e;font-weight:950}.step h3{font-size:1.35rem;margin:1rem 0 .5rem}.step p{color:#c5d1dc}.metric{display:block;color:var(--accent,var(--coral));font-weight:900;margin-top:1rem}.cautions{margin:2rem 0 0;padding:1.2rem 1.2rem 1.2rem 2.4rem;background:#ffffff08;border-radius:18px}.practice-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}.pulse-panel,.quality-list{display:grid;place-items:center;padding:2rem;border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}.pulse{width:min(62vw,280px);aspect-ratio:1;border-radius:50%;border:12px solid #ffffff18;background:var(--coral);color:#07131e;box-shadow:0 0 0 0 #ff6b5e66;cursor:pointer}.pulse.running{animation:beat var(--beat,.545s) infinite}.pulse span{display:block;font-size:5rem;font-weight:950;line-height:1}.pulse small{font-weight:800}.practice-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:1rem;margin-top:1.2rem}.practice-controls label{display:grid;color:var(--muted)}.quality-list{display:block}.quality-list li{margin:.8rem 0}.quiz-list{display:grid;gap:1rem}.quiz-card{padding:1.4rem;border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}.quiz-card h3{font-size:1.35rem}.choices{display:grid;gap:.7rem}.choice{padding:1rem;text-align:left;border:1px solid var(--line);border-radius:14px;background:#ffffff06;color:var(--text);font:inherit;cursor:pointer}.choice:hover,.choice:focus{border-color:var(--cyan)}.choice.correct{border-color:var(--green);background:#4ed49a18}.choice.wrong{border-color:var(--red);background:#e23b3b18}.reasoning{padding:1rem;margin-top:1rem;border-left:4px solid var(--cyan);background:#27c5d912}.handoff{display:grid;grid-template-columns:1fr auto;align-items:center;gap:3rem}.handoff h2{font-size:clamp(2.5rem,5vw,5.3rem)}.qr{width:280px;aspect-ratio:1;padding:16px;background:#fff;border-radius:24px}.qr img,.qr svg{width:100%;height:100%}.url{word-break:break-all;color:var(--cyan)}.sources{color:var(--muted)}.sources a{display:block;padding:.8rem 0;color:var(--text)}footer{display:flex;justify-content:space-between;gap:1rem;padding:2rem max(1rem,calc((100vw - var(--max))/2));border-top:1px solid var(--line);color:var(--muted)}.noscript{position:fixed;bottom:0;inset-inline:0;padding:1rem;background:var(--amber);color:#000}.present-controls{position:fixed;z-index:60;bottom:1rem;left:50%;transform:translateX(-50%);display:flex;gap:.5rem;align-items:center;padding:.5rem;background:#06101acc;border:1px solid var(--line);border-radius:999px;backdrop-filter:blur(12px)}.present-controls button{border:0;border-radius:999px;padding:.6rem .9rem;background:#ffffff12;color:#fff;cursor:pointer}
@keyframes beat{50%{transform:scale(.94);box-shadow:0 0 0 26px #ff6b5e00}0%{box-shadow:0 0 0 0 #ff6b5e66}}
:focus-visible{outline:3px solid var(--amber);outline-offset:3px}
body.present{overflow:hidden}body.present .topbar,body.present .module-nav,body.present footer{display:none}body.present main{height:100vh}body.present .present-slide{display:none;max-width:none;height:100vh;overflow:auto;padding:5vh 6vw}body.present .present-slide.active{display:grid}body.present .hero{grid-template-columns:1.1fr .9fr;min-height:100vh}body.present .module .section-heading{align-self:end}body.present .module .step-grid{align-self:start}body.present .step{min-height:210px}body.present .hero h1{font-size:6.6vw}body.present .emergency-note{align-self:start}
@media(max-width:760px){html{scroll-padding-top:68px}.topbar{padding:.65rem 1rem}.top-actions .ghost{display:none}.compact{font-size:.85rem}.hero{grid-template-columns:1fr;min-height:auto;padding-top:3rem}.hero h1{font-size:clamp(3rem,15vw,5rem)}.module-nav{top:64px}.section-heading{grid-template-columns:1fr}.step-grid{grid-template-columns:1fr}.step{min-height:auto}.practice-grid,.handoff{grid-template-columns:1fr}.qr{width:min(78vw,320px);justify-self:center}footer{display:grid}.page-section{padding-block:4rem}.call{box-shadow:0 8px 25px #e23b3b55}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.pulse.running{animation:none}}
```

- `clinical/cpr-komuniti-v0/app.js:1-40` — verbatim:

```javascript
(() => {
  const content = window.CPR_CONTENT;
  if (!content) return;
  const accent = {red:'#e23b3b',coral:'#ff6b5e',cyan:'#27c5d9',green:'#4ed49a',amber:'#ffc857'};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modules = document.querySelector('#modules');
  modules.innerHTML = content.modules.map(module => `
    <section id="${esc(module.id)}" class="module page-section present-slide" data-title="${esc(module.title)}" style="--accent:${accent[module.accent] || accent.coral}">
      <div class="section-heading"><p class="eyebrow">${esc(module.eyebrow)}</p><h2>${esc(module.title)}</h2><p>${esc(module.summary)}</p></div>
      <div class="step-grid">${module.steps.map(step => `<article class="step"><span class="step-label">${esc(step.label)}</span><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p>${step.metric ? `<b class="metric">${esc(step.metric)}</b>` : ''}</article>`).join('')}</div>
      ${module.cautions ? `<ul class="cautions">${module.cautions.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    </section>`).join('');

  const quizList = document.querySelector('#quizList');
  quizList.innerHTML = content.quiz.map((q, qi) => `<article class="quiz-card" data-quiz="${qi}"><h3>${qi + 1}. ${esc(q.prompt)}</h3><div class="choices">${q.choices.map((choice, ci) => `<button class="choice" type="button" data-choice="${ci}">${esc(choice)}</button>`).join('')}</div><p class="reasoning" hidden></p></article>`).join('');
  quizList.addEventListener('click', event => {
    const button = event.target.closest('.choice'); if (!button) return;
    const card = button.closest('.quiz-card'); const q = content.quiz[Number(card.dataset.quiz)]; const selected = Number(button.dataset.choice);
    card.querySelectorAll('.choice').forEach((el, index) => { el.disabled = true; if (index === q.answer) el.classList.add('correct'); else if (index === selected) el.classList.add('wrong'); });
    const reasoning = card.querySelector('.reasoning'); reasoning.hidden = false; reasoning.textContent = (selected === q.answer ? 'Betul — ' : 'Belum tepat — ') + q.reasoning;
  });

  document.querySelector('#sourceList').innerHTML = content.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noreferrer">↗ ${esc(source.label)}</a>`).join('');
  const cleanUrl = location.href.split('#')[0].replace(/[?&]present=1/, '').replace(/[?&]$/, '');
  document.querySelector('#currentUrl').textContent = cleanUrl;
  const qrTarget = document.querySelector('#qr');
  if (window.qrcode && /^https?:/.test(cleanUrl)) { const qr = window.qrcode(0, 'M'); qr.addData(cleanUrl); qr.make(); qrTarget.innerHTML = qr.createSvgTag({cellSize:6,margin:0,scalable:true}); }
  else { qrTarget.style.background = '#102131'; qrTarget.innerHTML = '<div style="display:grid;place-items:center;height:100%;padding:1rem;text-align:center;color:#ffc857;font-weight:800">Gunakan apply_serve_on_lan.ps1 untuk menghasilkan QR yang boleh dicapai telefon.</div>'; }

  const bpm = document.querySelector('#bpm'); const bpmOutput = document.querySelector('#bpmOutput'); const pulse = document.querySelector('#pulseButton'); const countEl = document.querySelector('#pulseCount'); let timer; let count = 0; let audio;
  const tick = () => { count += 1; countEl.textContent = count; try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const osc = audio.createOscillator(); const gain = audio.createGain(); osc.frequency.value = count % 30 === 1 ? 760 : 520; gain.gain.setValueAtTime(.08, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .07); osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .08); } catch {} };
  const stop = () => { clearInterval(timer); timer = null; pulse.classList.remove('running'); pulse.setAttribute('aria-pressed','false'); pulse.querySelector('small').textContent = 'tekan untuk mula'; };
  const start = () => { stop(); const interval = 60000 / Number(bpm.value); pulse.style.setProperty('--beat', `${interval}ms`); pulse.classList.add('running'); pulse.setAttribute('aria-pressed','true'); pulse.querySelector('small').textContent = 'tekan untuk berhenti'; tick(); timer = setInterval(tick, interval); };
  pulse.addEventListener('click', () => timer ? stop() : start()); bpm.addEventListener('input', () => { bpmOutput.value = bpm.value; if (timer) start(); });
  document.querySelector('#resetPractice').addEventListener('click', () => { stop(); count = 0; countEl.textContent = '0'; });
  document.querySelector('#startPractice').addEventListener('click', () => { location.hash = '#practice'; setTimeout(start, 350); });

  document.querySelector('#shareButton').addEventListener('click', async () => { try { if (navigator.share) await navigator.share({title:content.meta.title,text:content.meta.subtitle,url:cleanUrl}); else { await navigator.clipboard.writeText(cleanUrl); alert('Pautan disalin.'); } } catch {} });
  let installPrompt; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; document.querySelector('#installButton').hidden = false; });
  document.querySelector('#installButton').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; document.querySelector('#installButton').hidden = true; });
```

- `clinical/cpr-komuniti-v0/content.js:1-1` — verbatim:

```javascript
window.CPR_CONTENT={"meta":{"title":"CPR Untuk Komuniti","subtitle":"Kenal pasti. Hubungi 999. Tekan dada. Gunakan AED.","language":"ms-MY","edition":"Adaptasi pendidikan daripada Manual CPR untuk Komuniti KKM (2019)","sourceUrl":"https://www.moh.gov.my/moh/resources/Arkib/MANUAL_CPR_UNTUK_KOMUNITI_KKM.pdf","sourceId":"MOH/P/PAK/418.19(HB)-e","safety":"Bahan pendidikan sahaja. Bukan pengganti latihan CPR bertauliah. Dalam kecemasan sebenar di Malaysia, hubungi 999 dan ikut arahan operator."},"memoryLine":["SELAMAT","RESPONS","999 + AED","TEKAN DADA"],"modules":[{"id":"adult","eyebrow":"TINDAKAN UTAMA","title":"Dewasa tidak responsif","summary":"Anggap jantung terhenti apabila mangsa tidak responsif dan tidak bernafas secara normal. Nafas tercungap-cungap bukan nafas normal.","accent":"red","steps":[{"label":"1","title":"Pastikan selamat","body":"Periksa bahaya kepada anda, mangsa dan orang sekeliling. Jangan dekati wayar hidup, trafik, api atau tumpahan berbahaya."},{"label":"2","title":"Periksa respons","body":"Tepuk bahu dan tanya dengan kuat: “Hello! Anda OK?”"},{"label":"3","title":"Jerit bantuan + hubungi 999","body":"Arahkan orang tertentu: “Anda, telefon 999 dan bawa AED.” Jika bersendirian, guna pembesar suara."},{"label":"4","title":"Periksa pernafasan","body":"Buka saluran pernafasan dan nilai pernafasan tidak melebihi 10 saat. Jika tidak normal atau ragu-ragu, mula tekan dada."},{"label":"5","title":"Tekan dada","body":"Tengah dada. Tangan bertindih, siku lurus, bahu tegak di atas tangan.","metric":"100–120/min • 5–6 cm • recoil penuh"},{"label":"6","title":"30:2 jika terlatih","body":"Berikan 30 tekanan dan 2 hembusan. Jika tidak terlatih atau tidak mahu memberi nafas bantuan, teruskan hands-only CPR."},{"label":"7","title":"Gunakan AED segera","body":"Hidupkan AED, tampal pad dan ikut arahan suara. Sambung tekanan serta-merta selepas analisis atau kejutan."}]},{"id":"quality","eyebrow":"CPR BERKUALITI","title":"Empat nombor yang menyelamatkan masa","summary":"Tekanan yang konsisten mengekalkan aliran darah sementara bantuan perubatan tiba.","accent":"coral","steps":[{"label":"110","title":"Sasaran rentak","body":"Kekal dalam julat 100–120 tekanan seminit. Metronom latihan ditetapkan pada 110."},{"label":"5–6","title":"Kedalaman dewasa","body":"Tekan sekurang-kurangnya 5 cm tetapi tidak melebihi 6 cm."},{"label":"30:2","title":"Jika beri nafas bantuan","body":"Dua hembusan selepas setiap 30 tekanan; minimumkan gangguan."},{"label":"<10s","title":"Gangguan","body":"Pastikan setiap jeda sesingkat mungkin dan dada kembali sepenuhnya selepas setiap tekanan."}]},{"id":"aed","eyebrow":"AED","title":"Hidupkan. Tampal. Jauh. Sambung.","summary":"Sesiapa boleh menggunakan AED. Alat akan menganalisis rentak jantung dan hanya mengarahkan kejutan apabila sesuai.","accent":"cyan","steps":[{"label":"ON","title":"Hidupkan AED","body":"Letakkan di sebelah mangsa. Buka penutup atau tekan butang ON."},{"label":"PAD","title":"Tampal pad","body":"Satu pad di dada kanan atas, satu lagi di dada kiri bawah. Dedahkan dan keringkan dada jika perlu."},{"label":"CLEAR","title":"Jangan sentuh","body":"Berhenti seketika semasa analisis. Jerit “Jauh!” dan lihat sekeliling sebelum kejutan."},{"label":"CPR","title":"Sambung serta-merta","body":"Sambung tekanan dada selepas kejutan atau apabila AED menyatakan tiada kejutan diperlukan."}],"cautions":["Jangan letak pad di atas tampalan ubat atau bonjolan perentak jantung.","Keringkan dada yang basah.","Untuk kanak-kanak 1–8 tahun, gunakan pad pediatrik jika ada dan ikut gambar pada pad."]},{"id":"child","eyebrow":"KANAK-KANAK & BAYI","title":"Pernafasan lebih penting — tetapi jangan lewat bertindak","summary":"Masalah pernafasan lebih kerap mendahului jantung terhenti pada kanak-kanak. Berikan 5 nafas awal jika terlatih, kemudian CPR 30:2.","accent":"green","steps":[{"label":"KANAK","title":"Kanak-kanak","body":"Tekan tengah dada menggunakan satu atau dua tangan mengikut saiz.","metric":"100–120/min • kira-kira 1/3 dada (±5 cm)"},{"label":"BAYI","title":"Bayi <1 tahun","body":"Gunakan dua jari di tengah dada untuk penyelamat tunggal.","metric":"100–120/min • kira-kira 1/3 dada (±4 cm)"},{"label":"5","title":"Nafas awal","body":"Jika tidak bernafas dan anda terlatih, beri 5 hembusan yang cukup untuk menaikkan dada."},{"label":"1 min","title":"Jika benar-benar bersendirian","body":"Manual KKM 2019 mengajar kira-kira 1 minit CPR sebelum meninggalkan mangsa kanak-kanak/bayi untuk mendapatkan bantuan. Jika telefon ada, hubungi 999 menggunakan pembesar suara tanpa meninggalkan mangsa."}]},{"id":"choking","eyebrow":"TERCEKIK","title":"Batuk kuat atau batuk lemah?","summary":"Keupayaan batuk menentukan tindakan. Jangan melakukan sapuan jari secara membuta tuli.","accent":"amber","steps":[{"label":"BATUK","title":"Batuk berkesan","body":"Galakkan mangsa terus batuk. Pantau dengan dekat; jangan ganggu batuk yang kuat."},{"label":"5","title":"Batuk tidak berkesan","body":"Berikan sehingga 5 tepukan belakang di antara tulang belikat."},{"label":"5","title":"Masih tersekat","body":"Dewasa/kanak-kanak: sehingga 5 tekanan perut. Bayi: 5 tekanan dada — jangan tekan perut bayi."},{"label":"CPR","title":"Menjadi tidak sedar","body":"Baringkan di permukaan rata, hubungi 999 dan mulakan CPR. Keluarkan objek hanya jika jelas kelihatan dan mudah dicapai."}]}],"quiz":[{"id":"q1","prompt":"Seorang dewasa rebah, tidak responsif dan tercungap-cungap. Apa tindakan seterusnya?","choices":["Tunggu sehingga nafas berhenti sepenuhnya","Hubungi 999/AED dan mula tekan dada","Beri air"],"answer":1,"reasoning":"Nafas tercungap-cungap tidak dianggap normal. Aktifkan bantuan dan mulakan CPR segera."},{"id":"q2","prompt":"AED sedang menganalisis rentak jantung. Apa yang perlu dilakukan?","choices":["Terus pegang bahu mangsa","Pastikan tiada sesiapa menyentuh mangsa","Tanggalkan semua pad"],"answer":1,"reasoning":"Hentikan sentuhan semasa analisis dan kejutan. Sambung CPR serta-merta selepas arahan AED."},{"id":"q3","prompt":"Bayi sedar tetapi tercekik dan batuk tidak berkesan. Selepas 5 tepukan belakang masih tersekat. Apa seterusnya?","choices":["5 tekanan perut","5 tekanan dada","Sapuan jari secara membuta tuli"],"answer":1,"reasoning":"Gunakan tekanan dada untuk bayi. Tekanan perut tidak digunakan pada bayi."}],"sources":[{"label":"Manual CPR untuk Komuniti, KKM (2019)","url":"https://www.moh.gov.my/moh/resources/Arkib/MANUAL_CPR_UNTUK_KOMUNITI_KKM.pdf"},{"label":"Adult Basic Life Support Guidelines 2025, Resuscitation Council UK","url":"https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines"}]};
```

Other files in this part: `clinical/cpr-komuniti-v0/index.html`, `clinical/cpr-komuniti-v0/manifest.webmanifest`, `clinical/cpr-komuniti-v0/qrcode.js`, `clinical/cpr-komuniti-v0/sw.js`, `clinical/cpr-scenario-lab-v1/DESIGN.md`, `clinical/cpr-scenario-lab-v1/dist/assets/index-BBBtzUxn.css`, `clinical/cpr-scenario-lab-v1/dist/index.html`, `clinical/cpr-scenario-lab-v1/index.html`, `clinical/cpr-scenario-lab-v1/package-lock.json`, `clinical/cpr-scenario-lab-v1/package.json`, `clinical/cpr-scenario-lab-v1/src/App.jsx`, `clinical/cpr-scenario-lab-v1/src/index.css`, `clinical/cpr-scenario-lab-v1/src/main.jsx`, `clinical/cpr-scenario-lab-v1/vite.config.js`, `clinical/ecc-react-lab/.gitignore`, `clinical/ecc-react-lab/.oxlintrc.json`, `clinical/ecc-react-lab/README.md`, `clinical/ecc-react-lab/dist/assets/index-JbGoKzsM.css`, `clinical/ecc-react-lab/dist/favicon.svg`, `clinical/ecc-react-lab/dist/icons.svg`, `clinical/ecc-react-lab/dist/index.html`, `clinical/ecc-react-lab/index.html`, `clinical/ecc-react-lab/package-lock.json`, `clinical/ecc-react-lab/package.json`, `clinical/ecc-react-lab/public/favicon.svg`, `clinical/ecc-react-lab/public/icons.svg`, `clinical/ecc-react-lab/src/App.css`, `clinical/ecc-react-lab/src/App.jsx`, `clinical/ecc-react-lab/src/assets/react.svg`, `clinical/ecc-react-lab/src/assets/vite.svg`, `clinical/ecc-react-lab/src/components/BatikPattern.jsx`, `clinical/ecc-react-lab/src/components/BilingualCard.jsx`, `clinical/ecc-react-lab/src/components/Header.jsx`, `clinical/ecc-react-lab/src/components/MouthMap.jsx`, `clinical/ecc-react-lab/src/components/NavPills.jsx`, `clinical/ecc-react-lab/src/components/SectionExam.jsx`, `clinical/ecc-react-lab/src/components/SectionIntro.jsx`, `clinical/ecc-react-lab/src/components/SectionPrevention.jsx`, `clinical/ecc-react-lab/src/components/SectionRisk.jsx`, `clinical/ecc-react-lab/src/components/SectionTakeHome.jsx`, `clinical/ecc-react-lab/src/components/SectionTreatment.jsx`, `clinical/ecc-react-lab/src/components/ToothLab.jsx`, `clinical/ecc-react-lab/src/data/content.js`, `clinical/ecc-react-lab/src/index.css`, `clinical/ecc-react-lab/src/main.jsx`, `clinical/ecc-react-lab/vite.config.js`, `clinical/ecc-realistic-tooth-lab/index.html`, `clinical/ecc-tooth-lab-mouth-map/index.html`, `clinical/ecc-tooth-lab/index.html`, `clinical/presentation-design-studio/PORTS.md`, `clinical/presentation-design-studio/adapters.js`, `clinical/presentation-design-studio/app.js`, `clinical/presentation-design-studio/index.html`, `clinical/presentation-design-studio/studio-core.js`, `clinical/presentation-design-studio/style.css`

## previews

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: previews/deckmate-studio/README.md, previews/deckmate-studio/index.html, previews/deckmate-studio/preview.js, previews/deckmate-studio/style.css.

### Where it lives

- `previews/deckmate-studio/README.md:1-17` — verbatim:

````markdown
# Deckmate + Studio concept preview

Static, non-production concept for cloud-agent and operator review. It does not read localStorage, Firebase, authentication state, or production data.

Preview from the repository root:

```text
python -m http.server 4173
http://localhost:4173/previews/deckmate-studio/
```

Design direction:

- Deckmate uses visible progress and story readiness to help a student move toward presenting.
- Studio uses a tactile pinboard metaphor for collecting and reusing notes, images, and opening lines.
- Both inherit Family Lab’s warm tokens and accessibility floor without becoming visually identical.

````

- `previews/deckmate-studio/index.html:1-40` — verbatim:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Family Lab — Deckmate & Studio Preview</title>
  <link rel="stylesheet" href="../../shared/theme.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <a class="skip-link" href="#preview">Skip to preview</a>
  <header class="topbar">
    <a class="brand" href="../../index.html" aria-label="Back to Family Lab">
      <span class="brand-mark" aria-hidden="true">FL</span>
      <span><strong>Family Lab</strong><small>Preview workspace</small></span>
    </a>
    <div class="preview-note"><span></span>Concept only · no live data</div>
  </header>

  <main id="preview">
    <section class="intro">
      <p class="eyebrow">One place to make and remember</p>
      <h1>School ideas, from first note to confident presentation.</h1>
      <p>Deckmate turns research into a clear story. Studio keeps the useful pieces close, so nothing gets lost between homework sessions.</p>
      <div class="product-switch" role="tablist" aria-label="Choose preview">
        <button role="tab" aria-selected="true" aria-controls="deckmate-panel" id="deckmate-tab" data-panel="deckmate-panel">
          <span aria-hidden="true">✦</span><b>Deckmate</b><small>Shape the story</small>
        </button>
        <button role="tab" aria-selected="false" aria-controls="studio-panel" id="studio-tab" data-panel="studio-panel">
          <span aria-hidden="true">⌂</span><b>Studio</b><small>Keep the pieces</small>
        </button>
      </div>
    </section>

    <section class="app-shell" id="deckmate-panel" role="tabpanel" aria-labelledby="deckmate-tab">
      <aside class="rail">
        <div class="rail-head"><span class="mini-logo">D</span><strong>Deckmate</strong></div>
        <nav aria-label="Deck sections">
          <button class="nav-item active"><span>01</span>My decks</button>
          <button class="nav-item"><span>02</span>Idea tray</button>
```

- `previews/deckmate-studio/preview.js:1-18` — verbatim:

```javascript
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activate(tab) {
  tabs.forEach((candidate) => candidate.setAttribute('aria-selected', String(candidate === tab)));
  panels.forEach((panel) => { panel.hidden = panel.id !== tab.dataset.panel; });
  tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    activate(tabs[(index + offset + tabs.length) % tabs.length]);
  });
});
```

- `previews/deckmate-studio/style.css:1-3` — verbatim:

```css
:root{--preview-ink:#17312f;--preview-cream:#fbf5e9;--preview-paper:#fffdf8;--preview-green:#246a5a;--preview-coral:#e7755d;--preview-yellow:#f3ca52;--preview-blue:#a8cee0;--preview-shadow:0 24px 60px rgba(23,49,47,.13)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{min-height:100vh;background:radial-gradient(circle at 8% 0%,#fff8d8 0,transparent 24rem),var(--preview-cream);color:var(--preview-ink)}button,a{font:inherit}.skip-link{position:fixed;left:1rem;top:-5rem;z-index:20;background:#fff;padding:.75rem 1rem;color:var(--preview-ink)}.skip-link:focus{top:1rem}.topbar{max-width:1240px;margin:auto;padding:20px 24px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none}.brand-mark,.mini-logo{display:grid;place-items:center;background:var(--preview-ink);color:#fff;border-radius:10px;font-weight:800}.brand-mark{width:42px;height:42px}.brand span:last-child{display:grid}.brand small{color:var(--muted)}.preview-note{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}.preview-note span{width:8px;height:8px;border-radius:50%;background:var(--warm)}main{max-width:1240px;margin:auto;padding:42px 24px 90px}.intro{max-width:780px;margin-bottom:32px}.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-size:12px;font-weight:800;color:var(--preview-green)}.intro h1{font-size:clamp(38px,6vw,72px);line-height:.98;margin:12px 0 20px;max-width:780px}.intro>p:not(.eyebrow){font-size:18px;line-height:1.6;max-width:650px;color:var(--muted)}.product-switch{display:flex;gap:10px;margin-top:28px}.product-switch button{min-width:180px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.6);padding:13px 16px;display:grid;grid-template-columns:32px 1fr;text-align:left;cursor:pointer}.product-switch button>span{grid-row:1/3;font-size:22px}.product-switch small{color:var(--muted)}.product-switch [aria-selected=true]{background:var(--preview-ink);color:#fff;box-shadow:var(--preview-shadow)}.product-switch [aria-selected=true] small{color:#d9e6e2}.app-shell{min-height:690px;display:grid;grid-template-columns:210px 1fr;background:var(--preview-paper);border:1px solid rgba(23,49,47,.12);border-radius:26px;overflow:hidden;box-shadow:var(--preview-shadow)}.rail{padding:26px 18px;background:#e8f0e9;display:flex;flex-direction:column}.rail-head{display:flex;gap:10px;align-items:center;margin-bottom:32px}.mini-logo{width:34px;height:34px;background:var(--preview-green)}.rail nav{display:grid;gap:6px}.nav-item{border:0;background:transparent;padding:11px;border-radius:10px;text-align:left;color:var(--muted);cursor:pointer}.nav-item span{font-size:10px;margin-right:8px}.nav-item.active{background:#fff;color:var(--preview-ink);font-weight:800}.rail-tip{margin-top:auto;background:rgba(255,255,255,.68);padding:14px;border-radius:14px}.rail-tip p{font-size:12px;line-height:1.5;margin:5px 0;color:var(--muted)}.workspace{padding:34px;min-width:0}.workspace-head,.section-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}.workspace-head h2{font-size:34px;margin:4px 0}.context{font-size:13px;color:var(--muted);margin:0}.primary-action{border:0;background:var(--preview-green);color:#fff;padding:12px 18px;border-radius:12px;font-weight:800}.continue-card{display:grid;grid-template-columns:1fr 230px;min-height:220px;background:#fff0c7;border-radius:22px;padding:28px;margin:28px 0}.continue-copy h3{font-size:30px;margin:14px 0 6px}.continue-copy p,.continue-copy small{color:#6f654d}.status-pill{display:inline-block;border:1px solid rgba(23,49,47,.2);border-radius:99px;padding:5px 9px;font-size:11px;font-weight:800}.progress{max-width:340px;height:8px;background:rgba(23,49,47,.12);border-radius:99px;margin:22px 0 8px;overflow:hidden}.progress span{display:block;height:100%;background:var(--preview-coral)}.slide-stack{position:relative;min-height:160px}.slide-stack span{position:absolute;inset:15px 0 0 25px;background:#fff;border-radius:10px;box-shadow:0 12px 24px rgba(23,49,47,.12);transform:rotate(7deg)}.slide-stack span:nth-child(2){transform:rotate(-3deg);inset:8px 15px 7px 8px;background:#d8ebdf}.slide-stack span:nth-child(3){transform:rotate(1deg);inset:0 22px 14px 0;display:grid;place-items:center;text-align:center;font-family:var(--fd);font-size:22px}.section-heading h3{font-size:22px}.section-heading button,.note-card button{border:0;background:transparent;color:var(--preview-green);font-weight:800}.deck-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.project-card{min-height:185px;border-radius:18px;padding:20px}.project-card h4{font-size:20px;margin:22px 0 5px}.project-card p{font-size:13px;color:#5d6966}.project-card>span{font-size:11px;font-weight:800}.card-icon{font-size:26px}.sunflower{background:#ffeda9}.coral{background:#f8d4ca}.mint{background:#d9eee6}.studio-shell .rail{background:#efe7db}.studio-shell .mini-logo{background:#87574a}.studio-shell .primary-action{background:#87574a}.pinboard{display:grid;grid-template-columns:1.15fr .85fr 1fr;gap:18px;padding:30px;background-color:#ded1bd;background-image:radial-gradient(rgba(67,52,43,.12) 1px,transparent 1px);background-size:13px 13px;border-radius:22px;margin:28px 0}.note-card{position:relative;min-height:230px;padding:22px;box-shadow:0 13px 22px rgba(67,52,43,.14);transform:rotate(-1.4deg)}.note-card:nth-child(2){transform:rotate(1.2deg)}.note-card:nth-child(3){transform:rotate(-.3deg)}.note-card h3{font-size:21px;margin:12px 0 8px}.note-card p{font-size:14px;line-height:1.55}.note-card small{font-weight:800;color:#665d51}.note-yellow{background:#fff0a7}.note-blue{background:#d8edf6}.photo-card{background:#fff}.pin{position:absolute;top:7px;left:50%;color:#a24f42}.photo-placeholder{height:120px;background:linear-gradient(145deg,#8eafaf,#345f61);display:grid;place-items:end start;padding:10px;color:#fff;margin-bottom:12px}.folder-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.folder-row article{display:flex;align-items:center;gap:12px;border:1px solid var(--line);padding:16px;border-radius:14px;background:#fff}.folder-row article>span{display:grid;place-items:center;width:45px;height:45px;border-radius:12px;background:#eee2d2;font-weight:800}.folder-row h4,.folder-row p{margin:0}.folder-row p{font-size:12px;color:var(--muted);margin-top:4px}.design-notes{padding:76px 0 0}.design-notes h2{font-size:36px;max-width:640px}.design-notes>div{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.design-notes article{border-top:2px solid var(--preview-ink);padding-top:14px}.design-notes p{color:var(--muted);line-height:1.6}.app-shell[hidden]{display:none!important}button:focus-visible,a:focus-visible{outline:3px solid var(--warm);outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
@media(max-width:800px){.topbar{padding:16px}.preview-note{display:none}main{padding:24px 14px 60px}.intro h1{font-size:42px}.product-switch{overflow-x:auto}.app-shell{display:block;min-height:0}.rail{display:none}.workspace{padding:20px}.workspace-head{align-items:flex-end}.workspace-head h2{font-size:28px}.continue-card{grid-template-columns:1fr;padding:20px}.slide-stack{display:none}.deck-row,.design-notes>div{grid-template-columns:1fr}.project-card{min-height:145px}.pinboard{grid-template-columns:1fr;padding:18px}.note-card{min-height:190px;transform:none!important}.folder-row{grid-template-columns:1fr}}
```

## scripts

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: scripts/build-family-hub-config.mjs, scripts/build-studio-config.mjs, scripts/prepare-deploy-bundle.mjs, scripts/sync-secrets.mjs.

### Where it lives

- `scripts/build-family-hub-config.mjs:1-40` — verbatim:

```text
#!/usr/bin/env node
/**
 * Generate apps/family-hub/family.config.local.js from environment variables.
 *
 * Expected env vars (set by GitHub Actions from repository secrets):
 *   FIREBASE_API_KEY
 *   FIREBASE_URL
 *   FIREBASE_ROOT_FAMILY_HUB  (defaults to "familyHub")
 *
 * The generated file is gitignored and is consumed by apps/family-hub/family.config.js
 * alongside the committed base config.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, "..", "apps", "family-hub", "family.config.local.js");

const apiKey = process.env.FIREBASE_API_KEY;
const url = process.env.FIREBASE_URL;
const root = process.env.FIREBASE_ROOT_FAMILY_HUB || "familyHub";

if (!apiKey || !url) {
  console.error("[build-family-hub-config] Missing FIREBASE_API_KEY or FIREBASE_URL");
  process.exit(1);
}

const file = `// Generated by scripts/build-family-hub-config.mjs — do not commit.
window.FAMILY_HUB_CONFIG_LOCAL = {
  firebase: {
    url: ${JSON.stringify(url)},
    root: ${JSON.stringify(root)},
    apiKey: ${JSON.stringify(apiKey)},
  },
};
`;
```

- `scripts/build-studio-config.mjs:1-40` — verbatim:

```text
#!/usr/bin/env node
/**
 * Generate apps/studio/studio.config.local.js from environment variables.
 *
 * Expected env vars (set by GitHub Actions from repository secrets):
 *   FIREBASE_API_KEY
 *   FIREBASE_URL
 *   FIREBASE_ROOT_STUDIO  (defaults to "studio")
 *
 * The generated file is gitignored and is consumed by apps/studio/firebase-rest.js
 * alongside the committed studio.config.js.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, "..", "apps", "studio", "studio.config.local.js");

const apiKey = process.env.FIREBASE_API_KEY;
const url = process.env.FIREBASE_URL;
const root = process.env.FIREBASE_ROOT_STUDIO || "studio";

if (!apiKey || !url) {
  console.error("[build-studio-config] Missing FIREBASE_API_KEY or FIREBASE_URL");
  process.exit(1);
}

const file = `// Generated by scripts/build-studio-config.mjs — do not commit.
window.STUDIO_APP_CONFIG_LOCAL = {
  firebase: {
    url: ${JSON.stringify(url)},
    root: ${JSON.stringify(root)},
  },
  auth: {
    apiKey: ${JSON.stringify(apiKey)},
  },
```

- `scripts/prepare-deploy-bundle.mjs:1-40` — verbatim:

```text
#!/usr/bin/env node
/**
 * Prepare the static deploy bundle under dist/.
 *
 * Usage:
 *   node scripts/prepare-deploy-bundle.mjs
 *
 * This centralises the copy logic that was duplicated across
 * .github/workflows/pages.yml and .github/workflows/deploy-cloudflare-pages.yml.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const filesToCopy = [
  "index.html",
  "clinical.html",
  "AGENTS.md",
  "README.md",
  "SECRETS.md",
];
const dirsToCopy = ["shared", "apps", "previews", "clinical"];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
```

- `scripts/sync-secrets.mjs:1-40` — verbatim:

```text
#!/usr/bin/env node
/**
 * Family Lab — Infisical → GitHub / Cloudflare Pages secret sync.
 *
 * Source of truth: Infisical project 90b0e7ef-3f72-4ddb-b888-055e90e13dfa
 * Targets:
 *   - GitHub repository secrets for arhsmoque/arh-family-lab
 *   - Cloudflare Pages project secrets for project arh-family-lab
 *
 * Run manually after rotating a secret, or as a workflow_dispatch job.
 * Never logs secret values — only key names and status.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = "90b0e7ef-3f72-4ddb-b888-055e90e13dfa";
const INFISICAL_API = "https://app.infisical.com/api/v3/secrets/raw";
const UNIVERSAL_AUTH_URL = "https://app.infisical.com/api/v1/auth/universal-auth/login";
const REPO = "arhsmoque/arh-family-lab";
const CF_PAGES_PROJECT = "arh-family-lab";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";

const DRY_RUN = process.argv.includes("--dry-run");

function log(...args) {
  console.log("[sync-secrets]", ...args);
}

function fail(...args) {
  console.error("[sync-secrets] ERROR", ...args);
  process.exitCode = 1;
}

```

## servers

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: servers/kids-terminal/.env, servers/kids-terminal/agy-cadet-tray.ahk, servers/kids-terminal/app.js, servers/kids-terminal/config.json, servers/kids-terminal/index.html, servers/kids-terminal/package-lock.json, servers/kids-terminal/package.json, servers/kids-terminal/server.js, servers/kids-terminal/server.lock, servers/kids-terminal/setup-aliases.ps1, servers/kids-terminal/shared-bridge.mjs, servers/kids-terminal/style.css.

### Where it lives

- `servers/kids-terminal/.env:1-9` — verbatim:

```text
FIREBASE_API_KEY='AIzaSyD7PzpBG9fk3BGM96vYOyKDaaOe3FDFnnY'
FIREBASE_ROOT='kids-terminal'
FIREBASE_URL='https://arh-firebase-db-default-rtdb.asia-southeast1.firebasedatabase.app'
PARENT_MASTER_EMAIL='arh.homelab@gmail.com'
PARENT_NOTIFY_URL='http://100.85.170.170:8080/notify'
PARENT_PIN='1234'
SECURITY_ENABLED='false'
SERVER_PORT='3000'
TAILSCALE_IP='100.85.130.130'
```

- `servers/kids-terminal/agy-cadet-tray.ahk:1-40` — verbatim:

```text
#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; Central Directories — prefer ARH_FAMILY_LAB_ROOT env var; fall back to
; deriving the repo root from this script's own location (it lives at
; <repoRoot>\servers\kids-terminal\agy-cadet-tray.ahk), so a fresh clone at
; any path works without editing this file.
RepoRoot := EnvGet("ARH_FAMILY_LAB_ROOT")
if (RepoRoot = "") {
    RepoRoot := RegExReplace(A_ScriptDir, "[\\/]servers[\\/]kids-terminal$", "")
}
AppDir := RepoRoot . "\servers\kids-terminal"
LockFile := AppDir . "\server.lock"

; Initialize Tray State
TraySetIcon("shell32.dll", 132) ; Default offline (Red X)
A_IconTip := "Agy Cadet Space Station`nStatus: Checking..."

; Create Custom Tray Menu
A_TrayMenu.Delete()
A_TrayMenu.Add("Agy Cadet Space Station", (*) => OpenBrowser())
A_TrayMenu.SetDefault("Agy Cadet Space Station")
A_TrayMenu.Add() ; Separator

Global StatusItemText := "Status: Checking..."
A_TrayMenu.Add(StatusItemText, (*) => CheckStatus())
A_TrayMenu.Disable(StatusItemText)
A_TrayMenu.Add() ; Separator

A_TrayMenu.Add("Open Cadet Console", (*) => OpenBrowser())
A_TrayMenu.Add("Open Parent Portal (/admin)", (*) => OpenAdmin())
A_TrayMenu.Add() ; Separator

A_TrayMenu.Add("Restart Express Server", (*) => RestartServer())
A_TrayMenu.Add("Sync Repository (git pull)", (*) => SyncRepository())
A_TrayMenu.Add("Static Rebuild Check", (*) => RebuildFrontend())
A_TrayMenu.Add() ; Separator

A_TrayMenu.Add("Exit Tray Agent", (*) => ExitApp())
```

- `servers/kids-terminal/app.js:1-40` — verbatim:

```javascript
// ============================================================================
// PURE BUSINESS LOGIC (Deterministic, zero I/O side effects, zero DOM)
// ============================================================================

const YamlParser = {
  parse(yamlStr) {
    const obj = {};
    const lines = yamlStr.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#') || !line.includes(':')) continue;

      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

      if (val.toLowerCase() === 'true') val = true;
      else if (val.toLowerCase() === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);

      else if (val === '' && lines[lines.indexOf(line) + 1]?.trim().startsWith('-')) {
        const arr = [];
        let nextIdx = lines.indexOf(line) + 1;
        while (nextIdx < lines.length && lines[nextIdx].trim().startsWith('-')) {
          const itemVal = lines[nextIdx].trim().slice(1).trim().replace(/^['"]|['"]$/g, '');
          arr.push(itemVal);
          nextIdx++;
        }
        obj[key] = arr;
      } else {
        obj[key] = val;
      }
    }
    return obj;
  }
};
```

- `servers/kids-terminal/config.json:1-40` — verbatim:

```json
{
  "firebase": {
    "url": "https://arh-firebase-db-default-rtdb.asia-southeast1.firebasedatabase.app",
    "root": "kids-terminal"
  },
  "auth": {
    "apiKey": "REPLACE_WITH_WEB_API_KEY"
  },
  "parent": {
    "pin": "REPLACE_WITH_A_PIN",
    "notifyUrl": "http://REPLACE_WITH_PARENT_PHONE_TAILSCALE_IP:8080/notify",
    "masterGatedEmail": "arh.homelab@gmail.com",
    "cadets": [
      "aflah",
      "haidar",
      "asma"
    ],
    "gatedKeywords": [
      "delete",
      "remove",
      "destroy",
      "format",
      "rm -rf",
      "system32",
      "cmd.exe",
      "powershell"
    ]
  },
  "theme": {
    "fontFamilyBody": "\"DM Sans\", system-ui, sans-serif",
    "fontFamilyHeading": "\"Playfair Display\", Georgia, serif",
    "fontSizeBody": "16px",
    "fontSizeConsole": "15px",
    "colorBackground": "#f7f1e8",
    "colorPaper": "#fffaf2",
    "colorSurface": "#ffffff",
    "colorInk": "#17211f",
    "colorMuted": "#63736f",
    "colorBrand": "#12323a",
    "colorAccent": "#2f7b67",
```

Other files in this part: `servers/kids-terminal/index.html`, `servers/kids-terminal/package-lock.json`, `servers/kids-terminal/package.json`, `servers/kids-terminal/server.js`, `servers/kids-terminal/server.lock`, `servers/kids-terminal/setup-aliases.ps1`, `servers/kids-terminal/shared-bridge.mjs`, `servers/kids-terminal/style.css`

## shared

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: shared/runtime/README.md, shared/runtime/auth.js, shared/runtime/config.js, shared/runtime/db.js, shared/runtime/plugin-host.js, shared/runtime/store.js, shared/runtime/ui.js, shared/theme.css.

### Where it lives

- `shared/runtime/README.md:1-34` — verbatim:

````markdown
# Shared Runtime

Opt-in ES-module plugins used by apps in this hub. The goal is to stop
copy-pasting Firebase auth/REST code across Family Hub, Studio, and Kids
Terminal, and to give new apps a clear onboarding path.

## Plugins

| Module | Purpose |
|---|---|
| `config.js` | Load base config + gitignored local override |
| `auth.js` | Firebase Identity Toolkit REST auth |
| `db.js` | Firebase Realtime Database REST layer |
| `store.js` | Generic `localStorage` cache + sync queue |
| `ui.js` | Modal, toast, HTML escape helpers |
| `plugin-host.js` | Manifest-driven app bootstrap |

## App contract

1. Create `apps/<name>/manifest.json`:
   ```json
   {
     "name": "my-app",
     "title": "My App",
     "entry": "./app.js",
     "plugins": ["config", "auth", "db"],
     "configKey": "MY_APP_CONFIG"
   }
   ```
2. `index.html` loads `shared/theme.css` and `shared/runtime/plugin-host.js` as a module.
3. `app.js` exports a `mount({ manifest, plugins })` function.

Existing apps that still use classic scripts continue to work; migration is
opt-in per app.
````

- `shared/runtime/auth.js:1-40` — verbatim:

```javascript
/**
 * Shared Firebase Identity Toolkit auth layer (no SDK).
 *
 * Usage:
 *   import { FirebaseAuth } from '../../shared/runtime/auth.js';
 *   const auth = new FirebaseAuth({ apiKey: '...' });
 *   await auth.signIn(email, password);
 */

const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1";
const REFRESH_BASE = "https://securetoken.googleapis.com/v1/token";

export class FirebaseAuth {
  constructor({ apiKey, sessionKey = "arh_firebase_session_v1" }) {
    if (!apiKey) throw new Error("FirebaseAuth requires apiKey");
    this.apiKey = apiKey;
    this.sessionKey = sessionKey;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async signUp(email, password) {
    const data = await this._authFetch("accounts:signUp", { email, password });
    const session = this._sessionFromAuthResponse(data);
    this._writeSession(session);
    return session;
  }

  async signIn(email, password) {
    const data = await this._authFetch("accounts:signInWithPassword", { email, password });
    const session = this._sessionFromAuthResponse(data);
    this._writeSession(session);
    return session;
  }

  async currentSession() {
    let session = this._readSession();
    if (!session) return null;
```

- `shared/runtime/config.js:1-40` — verbatim:

```javascript
/**
 * Shared runtime config loader.
 *
 * Each app declares a base config object and an optional window global
 * override (gitignored, generated at deploy time). This module merges them
 * and validates required keys.
 *
 * Usage:
 *   import { loadConfig } from '../../shared/runtime/config.js';
 *   const config = loadConfig('FAMILY_HUB_CONFIG', {
 *     required: ['firebase.url', 'firebase.apiKey'],
 *     defaults: { theme: 'warm', lang: 'en' }
 *   });
 */

export function loadConfig(baseGlobalName, options = {}) {
  const base = typeof window !== "undefined" && window[baseGlobalName]
    ? window[baseGlobalName]
    : {};

  const localGlobalName = `${baseGlobalName}_LOCAL`;
  const local = typeof window !== "undefined" && window[localGlobalName]
    ? window[localGlobalName]
    : {};

  const merged = deepMerge(base, local);

  if (options.defaults) {
    return deepMerge(options.defaults, merged);
  }

  if (options.required) {
    const missing = options.required.filter(path => {
      const value = getPath(merged, path);
      return value === undefined || value === null || value === "";
    });
    if (missing.length > 0) {
      throw new Error(`Missing required config: ${missing.join(", ")}`);
    }
  }
```

- `shared/runtime/db.js:1-40` — verbatim:

```javascript
/**
 * Shared Firebase Realtime Database REST layer (no SDK).
 *
 * Usage:
 *   import { FirebaseDB } from '../../shared/runtime/db.js';
 *   const db = new FirebaseDB({ baseUrl: 'https://...firebaseio.com', root: 'familyHub' });
 *   const data = await db.get('households/owner/tasks', { auth: idToken });
 *   await db.patch('households/owner/tasks', { newTask: true }, { auth: idToken });
 */

export class FirebaseDB {
  constructor({ baseUrl, root = "" }) {
    if (!baseUrl) throw new Error("FirebaseDB requires baseUrl");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.root = root;
  }

  _url(path, { auth, shallow } = {}) {
    let url = `${this.baseUrl}/${this.root ? `${this.root}/` : ""}${path}.json`;
    const params = new URLSearchParams();
    if (auth) params.set("auth", auth);
    if (shallow) params.set("shallow", "true");
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }

  async _fetch(method, path, body, opts) {
    const init = { method, headers: { "Content-Type": "application/json" } };
    if (body !== undefined) init.body = JSON.stringify(body);
    const r = await fetch(this._url(path, opts), init);
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      throw new Error(data?.error || `DB ${method} ${path} failed: ${r.status}`);
    }
    return data;
  }

  async get(path, opts = {}) {
    return this._fetch("GET", path, undefined, opts);
  }
```

Other files in this part: `shared/runtime/plugin-host.js`, `shared/runtime/store.js`, `shared/runtime/ui.js`, `shared/theme.css`

## test results

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: test-results/.last-run.json.

### Where it lives

- `test-results/.last-run.json:1-4` — verbatim:

```json
{
  "status": "passed",
  "failedTests": []
}
```

## tests

This section was generated without AI assistance (--no-llm). Re-run with the LLM enabled for a narrative description.

Files in this part: tests/baseline.spec.js, tests/flow-rehearsals.spec.js.

### Where it lives

- `tests/baseline.spec.js:24-63` — verbatim:

```javascript
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

```

- `tests/flow-rehearsals.spec.js:1-40` — verbatim:

```javascript
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
```
