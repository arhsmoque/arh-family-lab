# Family Lab — Architecture & Plugin Contract

This document captures the current state of the four apps, the issues found during the alignment pass, and the clean architecture proposal so that future apps can be added as plugins instead of one-off rewrites.

## 1. Current app inventory

| App | Runtime | Config | Auth / DB | UI | Deployed |
|---|---|---|---|---|---|
| **Family Hub** | shared runtime (`shared-bridge.mjs`) | `family.config.js` + `.local.js` | Shared Firebase REST | Custom modal (was native `prompt`/`confirm`) | GitHub Pages + Cloudflare Pages |
| **Studio** | shared runtime (`shared-bridge.mjs`) | `studio.config.js` + `.local.js` | Shared Firebase REST | Custom in-app modal | GitHub Pages + Cloudflare Pages |
| **Deckmate** | Standalone (`apps/presentation/`) | Hard-coded / `localStorage` | None (local-only decks) | Custom modal system | GitHub Pages + Cloudflare Pages |
| **Kids Terminal** | Node/Express server (`servers/kids-terminal/`) | `config.json` + `.env` | Firebase via server | Custom in-app UI | Not deployable to static Pages; runs on a host with Node |

## 2. Issues found and fixed

1. **Kids Terminal leaked the parent PIN.**
   - `/api/config` returned the plaintext PIN when security was OFF.
   - The client cached the PIN in `localStorage`.
   - Fixed: `/api/config` always masks the PIN; client no longer stores it.

2. **Family Hub used native `prompt()` / `confirm()` / `alert()`.**
   - PIN change, sign-out, add member, add task, add checklist, and add event all used browser native dialogs.
   - Fixed: added a generic `#formModal` and `openFormModal()` helper; all flows now use the in-app modal.

3. **Studio config could be served from browser cache after a deploy.**
   - `studio.config.js` and `studio.config.local.js` were loaded with no cache-busting.
   - Fixed: added `?v=__BUILD_ID__` to both script tags; `prepare-deploy-bundle.mjs` now stamps the build id at deploy time.

4. **Family Hub service worker cached config files through the browser HTTP cache.**
   - `cache.addAll()` may reuse a stale HTTP cache entry.
   - Fixed: install now fetches each asset with `cache: 'no-store'` so every new `CACHE_NAME` gets fresh files.

5. **Playwright Kids Terminal rehearsal had a hard-coded port collision.**
   - Two workers both tried port 3000; the second fell back to 3001 while the test still pointed to 3000.
   - Fixed: `startKidsServer()` uses `SERVER_PORT=0`, parses the actual port from stdout, and the test navigates to the dynamic URL.

## 3. Proposed clean architecture

### 3.1 Core principle: apps are plugins

Every app lives in `apps/<app>/` and follows the same contract. The shared runtime in `shared/runtime/` is the platform; the app is a plugin that declares what it needs.

### 3.2 App contract

Each app ships:

```text
apps/<app>/
  index.html          # loads shared/runtime/plugin-host.js as a module
  manifest.json       # declares name, plugins, entry, configKey
  app.js              # ES module that exports mount({ manifest, plugins })
  config.js           # base (committed) config global
  config.local.js     # optional gitignored override (generated at deploy)
  style.css           # app-specific styles, imports shared/theme.css
```

Example `manifest.json`:

```json
{
  "name": "deckmate",
  "plugins": ["config", "auth", "db", "ui"],
  "entry": "./app.js",
  "configKey": "DECKMATE_CONFIG"
}
```

Example `app.js`:

```js
export function mount({ manifest, plugins }) {
  const config = plugins.config.loadConfig(manifest.configKey, {
    required: ['firebase.url', 'firebase.apiKey']
  });
  const auth = plugins.auth.create({ apiKey: config.auth.apiKey, sessionKey: 'deckmate-session-v1' });
  const db = plugins.db.create({ baseUrl: config.firebase.url, root: config.firebase.root });

  // App boot
  renderApp({ config, auth, db, ui: plugins.ui });
}
```

### 3.3 Shared runtime plugins

| Plugin | File | Responsibility |
|---|---|---|
| `config` | `shared/runtime/config.js` | Merge base + `*_LOCAL` config; validate required keys. |
| `auth` | `shared/runtime/auth.js` | Firebase Identity Toolkit REST (sign-up, sign-in, sign-out, session). |
| `db` | `shared/runtime/db.js` | Firebase Realtime Database REST (GET/PUT/PATCH/DELETE). |
| `ui` | `shared/runtime/ui.js` | Framework-agnostic modal, toast, prompt replacement. |
| `store` | `shared/runtime/store.js` | Local-first `localStorage` store + optional Firebase sync queue. |
| `plugin-host` | `shared/runtime/plugin-host.js` | Reads `manifest.json`, loads requested plugins, imports `entry`, calls `mount()`. |

### 3.4 Theme / design tokens

All apps import `shared/theme.css` for CSS variables (colors, spacing, type scale, touch targets). App-specific styles only override or add layout, never redefine tokens.

### 3.5 Adding a new app

To add a fifth app:

1. `mkdir apps/<new-app>`.
2. Add `manifest.json`, `index.html`, `config.js`, `app.js`, `style.css`.
3. If the app needs Firebase, add its root to Infisical and to `scripts/sync-secrets.mjs`.
4. Add the app to the root `index.html` hub page.
5. Add a Playwright flow rehearsal in `tests/flow-rehearsals.spec.js`.
6. Push — GitHub Pages + Cloudflare Pages deploy automatically.

No changes to shared runtime are required unless the new app introduces a genuinely new capability (e.g., a new backend provider).

## 4. Secrets & deployment

### 4.1 Source of truth

Infisical project `90b0e7ef-3f72-4ddb-b888-055e90e13dfa` is the source of truth. Folders:

- `/` — `GITHUB_PAT`
- `/arh-family-lab` — shared Firebase / Cloudflare credentials
- `/arh-family-lab/family-hub` — `FIREBASE_API_KEY`, `FIREBASE_URL`, `FIREBASE_ROOT`
- `/arh-family-lab/kids-terminal` — same keys for the Node server
- `/arh-family-lab/studio` — `FIREBASE_ROOT`

### 4.2 Sync targets

`scripts/sync-secrets.mjs` reads Infisical and writes to:

- **GitHub secrets** (`gh secret set`) — used by deploy workflows and by cloud agents.
- **Cloudflare Pages secrets** (`wrangler pages secret bulk`) — available to Pages Functions if needed.

Run via `.github/workflows/sync-secrets.yml` (`workflow_dispatch`) or locally with `INFISICAL_TOKEN` set.

### 4.3 Deploy pipeline

On every push to `main`:

1. `.github/workflows/pages.yml` and `.github/workflows/deploy-cloudflare-pages.yml` run.
2. They generate `family.config.local.js` and `studio.config.local.js` from GitHub secrets.
3. `scripts/prepare-deploy-bundle.mjs` copies `shared`, `apps`, etc. into `dist/` and stamps `__BUILD_ID__`.
4. The Family Hub service worker cache name is bumped to the commit SHA.
5. `dist/` is deployed to `gh-pages` and to Cloudflare Pages (`arh-family-lab.pages.dev`).

### 4.4 Local development

Run:

```bash
# Generate local config from Infisical
MSYS_NO_PATHCONV=1 infisical export --projectId=90b0e7ef-3f72-4ddb-b888-055e90e13dfa --env=dev --path=/arh-family-lab/family-hub --format=dotenv > .env
node scripts/convert-family-hub-env.mjs   # if a converter exists, or create one
pnpm serve
```

Until `family.config.local.js` exists, the app shows the "not configured" screen. That screen is intentional — it prevents the app from booting with a placeholder Firebase key.

## 5. Cloud-agent path

A cloud agent can work on this repo without the local machine:

1. Clone `https://github.com/arhsmoque/arh-family-lab.git`.
2. Edit code and push to `main`.
3. GitHub Actions builds the config from GitHub secrets and deploys.
4. Live URLs update automatically.

The only thing a cloud agent cannot do is run the Kids Terminal Node server (it needs a Node host). For the static apps, everything is fully automated.

## 6. Remaining work

1. **Migrate Deckmate** to the plugin-host/shared-runtime contract. It currently has no auth/db/config integration. The migration should:
   - Add `apps/presentation/manifest.json`.
   - Replace the custom `index.html` boot with `plugin-host.js`.
   - Move `app.js` to export `mount()`.
   - Optionally add Firebase-backed deck sync.

2. **Decide Kids Terminal hosting.** The Express server cannot run on GitHub/Cloudflare Pages. Options:
   - Keep it as a local/Tailscale server.
   - Package it as a Cloudflare Worker (requires porting file-system adapters).
   - Run it on RunPod / a small VPS with a GitHub Actions deploy step.

3. **Expand Playwright rehearsals** as new flows are added.

4. **Generate the O&M manual** with `arh-om-manual` once the above are settled.
