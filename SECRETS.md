# Family Lab — Secrets Management Strategy

**Source of truth:** Infisical project `90b0e7ef-3f72-4ddb-b888-055e90e13dfa`.  
**Targets:** GitHub repository secrets (`arhsmoque/arh-family-lab`) and Cloudflare Pages project secrets (`arh-family-lab`).  
**Principle:** Local dev pulls from Infisical; CI/CD and runtime pull from GitHub/Cloudflare secrets. No committed secrets.

---

## 1. Why This Matters

Previously:
- `apps/studio/studio.config.js` committed a real Firebase API key.
- `servers/kids-terminal/config.json` stored placeholder secrets in committed JSON.
- Family Hub already used the correct pattern: `family.config.js` + gitignored `family.config.local.js` generated from Infisical.
- GitHub Actions only knew `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.

With the plugin architecture and Cloudflare Pages deployment, workflows need Firebase details at build time, and Pages Functions may need them at runtime. Centralizing this prevents drift.

---

## 2. Infisical Layout

```
/                                     (root)
  GITHUB_PAT                          cross-repo / fleet workflows
/arh-family-lab
  FIREBASE_API_KEY                    shared Firebase web API key
/arh-family-lab/family-hub
  FIREBASE_API_KEY
  FIREBASE_URL
  FIREBASE_ROOT -> "familyHub"
/arh-family-lab/kids-terminal
  FIREBASE_API_KEY
  FIREBASE_URL
  FIREBASE_ROOT -> "kids-terminal"
  PARENT_PIN, PARENT_NOTIFY_URL, ...  local runtime only
/arh-family-lab/studio
  FIREBASE_API_KEY
  FIREBASE_URL
  FIREBASE_ROOT -> "studio"
```

`FIREBASE_API_KEY` and `FIREBASE_URL` are identical across apps, so they are synced as single shared secrets. `FIREBASE_ROOT` is per-app.

Local-only secrets (not synced to GitHub/Cloudflare):
- `PARENT_PIN`, `PARENT_NOTIFY_URL`, `PARENT_MASTER_EMAIL`, `TAILSCALE_IP`, `SERVER_PORT`, `SECURITY_ENABLED`

These are per-device or per-server runtime configuration, not CI/CD secrets.

---

## 3. Secret Mapping

| Secret | Infisical path | GitHub repo secret | Cloudflare Pages secret | Purpose |
|--------|----------------|--------------------|--------------------------|---------|
| `FIREBASE_API_KEY` | `/arh-family-lab/*` | `FIREBASE_API_KEY` | `FIREBASE_API_KEY` | Firebase REST auth / DB calls |
| `FIREBASE_URL` | `/arh-family-lab/*` | `FIREBASE_URL` | `FIREBASE_URL` | Realtime Database URL |
| `FIREBASE_ROOT` | `/arh-family-lab/family-hub` | `FIREBASE_ROOT_FAMILY_HUB` | `FIREBASE_ROOT_FAMILY_HUB` | `familyHub` DB root |
| `FIREBASE_ROOT` | `/arh-family-lab/studio` | `FIREBASE_ROOT_STUDIO` | `FIREBASE_ROOT_STUDIO` | `studio` DB root |
| `FIREBASE_ROOT` | `/arh-family-lab/kids-terminal` | `FIREBASE_ROOT_KIDS_TERMINAL` | `FIREBASE_ROOT_KIDS_TERMINAL` | `kids-terminal` DB root |
| `GITHUB_PAT` | `/` (root) | `GH_PAT`¹ | ❌ | Cross-repo / fleet workflows |
| `CLOUDFLARE_API_TOKEN` | not in Infisical | ✅ already set | N/A | Cloudflare API access |
| `CLOUDFLARE_ACCOUNT_ID` | not in Infisical | ✅ already set | N/A | Cloudflare account |

¹ GitHub forbids repository secret names that start with `GITHUB_`, so the Infisical key `GITHUB_PAT` is mapped to `GH_PAT` in GitHub.

---

## 4. Sync Mechanism

Run:

```bash
node scripts/sync-secrets.mjs --dry-run   # preview
node scripts/sync-secrets.mjs              # apply
```

The script:
1. Authenticates to Infisical using `INFISICAL_TOKEN` (local convenience) or `INFISICAL_CLIENT_ID` + `INFISICAL_CLIENT_SECRET` (cloud Machine Identity), then reads secrets via the Infisical HTTP API.
2. Validates that shared `FIREBASE_API_KEY` / `FIREBASE_URL` are identical across apps.
3. Derives app-specific `FIREBASE_ROOT_*` values.
4. Writes GitHub secrets via `gh secret set`.
5. Writes Cloudflare Pages secrets via `wrangler pages secret bulk`.
6. Never logs secret values; only logs key names and success/failure.

Prerequisites:
- Infisical access to project `90b0e7ef-3f72-4ddb-b888-055e90e13dfa`
- `gh` authenticated to `arhsmoque/arh-family-lab`
- `wrangler` authenticated to the Cloudflare account (account ID read from `CLOUDFLARE_ACCOUNT_ID` env var)

---

## 5. Local Dev Flow

```bash
# Generate local config from Infisical (one command per app)
MSYS_NO_PATHCONV=1 infisical export --projectId=90b0e7ef-3f72-4ddb-b888-055e90e13dfa \
  --env=dev --path=/arh-family-lab/family-hub --format=dotenv > .env
```

Apps read the base committed `*.config.js` and merge the gitignored `*.config.local.js` generated above.

---

## 6. CI/CD Flow

### GitHub Pages

`.github/workflows/pages.yml` runs `scripts/build-studio-config.mjs` before upload, injecting the Firebase secrets into `apps/studio/studio.config.local.js` (gitignored). The artifact uploaded to Pages therefore contains the real config without it ever being committed.

For local previews of the same step:

```bash
export FIREBASE_API_KEY="..."
export FIREBASE_URL="..."
export FIREBASE_ROOT_STUDIO="studio"
node scripts/build-studio-config.mjs
```

### Cloudflare Pages

Cloudflare Pages production secrets are populated by `scripts/sync-secrets.mjs` via `wrangler pages secret bulk`. Pages Functions or build steps read them from the environment directly.

---

## 7. Rotation Runbook

### From a local machine (with Infisical CLI)

1. Update the value in Infisical first.
2. Run `node scripts/sync-secrets.mjs --dry-run` to preview.
3. Run `node scripts/sync-secrets.mjs` to apply.
4. Re-run GitHub Actions / redeploy Cloudflare Pages.
5. Update any local `.config.local.js` files by re-running the Infisical export.
6. Never commit the new value.

### From GitHub Actions (cloud agent)

1. Update the value in Infisical.
2. Go to **Actions → Sync secrets from Infisical → Run workflow**.
3. The workflow authenticates to Infisical with the Machine Identity (`INFISICAL_CLIENT_ID` + `INFISICAL_CLIENT_SECRET`) and writes to GitHub / Cloudflare.
4. Pushes to `main` auto-deploy both GitHub Pages and Cloudflare Pages.

Required GitHub secrets for the cloud path: `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`. `INFISICAL_TOKEN` is supported only for local runs; the cloud workflow does not use it.

---

## 8. Known Gaps

- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are not yet synced from Infisical. Add them to the Infisical `/arh-family-lab` folder and extend `scripts/sync-secrets.mjs` to write them to GitHub secrets (and optionally Cloudflare Pages secrets) for a single source of truth.
- The legacy `scripts/apply-studio-secrets.mjs` (which patches `studio.config.js` from `STUDIO_DEV_PIN` / `STUDIO_DB_SECRET`) is kept for compatibility but should be retired once Studio consumes the new `FIREBASE_*` secrets.
