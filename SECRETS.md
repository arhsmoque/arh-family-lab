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
1. Reads selected secrets from Infisical CLI (`infisical secrets --path=...`).
2. Validates that shared `FIREBASE_API_KEY` / `FIREBASE_URL` are identical across apps.
3. Derives app-specific `FIREBASE_ROOT_*` values.
4. Writes GitHub secrets via `gh secret set`.
5. Writes Cloudflare Pages secrets via `wrangler pages secret bulk`.
6. Never logs secret values; only logs key names and success/failure.

Prerequisites:
- `infisical` logged in and able to read project `90b0e7ef-3f72-4ddb-b888-055e90e13dfa`
- `gh` authenticated to `arhsmoque/arh-family-lab`
- `wrangler` authenticated to Cloudflare account `dc3bfa957bdf216b7cc45214455aaa72`

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

1. Update the value in Infisical first.
2. Run `node scripts/sync-secrets.mjs --dry-run` to preview.
3. Run `node scripts/sync-secrets.mjs` to apply.
4. Re-run GitHub Actions / redeploy Cloudflare Pages.
5. Update any local `.config.local.js` files by re-running the Infisical export.
6. Never commit the new value.

---

## 8. Known Gaps

- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are currently stored only in GitHub secrets, not in Infisical. If you want Infisical to be the complete source of truth, add them to the Infisical root (or `/arh-family-lab`) and extend `scripts/sync-secrets.mjs` to sync them.
- The legacy `scripts/apply-studio-secrets.mjs` (which patches `studio.config.js` from `STUDIO_DEV_PIN` / `STUDIO_DB_SECRET`) is kept for compatibility but should be retired once Studio consumes the new `FIREBASE_*` secrets.
