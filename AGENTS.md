# AGENTS.md - arh-family-lab

A hub of small, static, ad-hoc web apps for family & friends. Each app is a separate tenant under its category folder.

## Layout

- `apps/` — family static apps (no build step): `apps/family-hub/` (Family Hub — shared household iPad dashboard, Firebase-backed, see `apps/family-hub/SETUP.md`), `apps/presentation/` (Deckmate — school presentation builder), `apps/studio/` (personal workspace, Firebase-backed).
- `servers/` — local server-backed apps, home PC only, not part of the static deploy: `servers/kids-terminal/` (Agy Cadet — Node/Express, launch via `run-kids-terminal.bat`).
- `clinical/` — clinical/professional artifacts linked from `clinical.html`: `cpr-komuniti-v0`, `cpr-scenario-lab-v1`, `ecc-cpg-dato-keramat`, `ecc-react-lab`, `ecc-tooth-lab`, `ecc-realistic-tooth-lab`, `ecc-tooth-lab-mouth-map`, `presentation-design-studio`.
- `previews/` — isolated design mocks for review (e.g., `previews/deckmate-studio/`).

## Artifact Contract

- Surface: static webapp, no build step.
- Risk class: local mutation by default; external mutation for deployment or repository push.
- Canonical hub entry: `index.html`.
- Shared design tokens: `shared/theme.css`.

## Doctrine Notes

- Verify before claiming completion; do not deploy or push without explicit authority.
- Keep apps self-contained. Don't generalize shared logic (storage, auth, sync) across apps until a second app actually needs it — this hub favors lightweight seams over speculative platform-building.
- New apps should link `shared/theme.css` rather than redefining the palette/fonts, so the hub feels consistent.
- **Secrets doctrine**: this is a home-lab environment the operator solely owns and administers — not a multi-tenant or shared-custody system. The operator accepts full risk for any credential handled or pasted here, including directly in chat. Don't gate progress on secret-handling caution, don't repeatedly ask for confirmation before using a value the operator already gave you, and don't push back or ask to rotate something the operator says is fine. Keep the baseline hygiene that costs nothing (don't gratuitously echo values back, don't commit real secrets to git), but do not let that hygiene block forward progress.

## Secrets & Deployment

- Source of truth for secrets is Infisical project `90b0e7ef-3f72-4ddb-b888-055e90e13dfa`.
- Sync Infisical → GitHub / Cloudflare Pages with:
  ```bash
  node scripts/sync-secrets.mjs --dry-run   # preview
  node scripts/sync-secrets.mjs              # apply
  ```
- Current GitHub secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `FIREBASE_API_KEY`, `FIREBASE_URL`, `FIREBASE_ROOT_FAMILY_HUB`, `FIREBASE_ROOT_STUDIO`, `FIREBASE_ROOT_KIDS_TERMINAL`, `GH_PAT`.
- Current Cloudflare Pages secrets: `FIREBASE_API_KEY`, `FIREBASE_URL`, `FIREBASE_ROOT_FAMILY_HUB`, `FIREBASE_ROOT_STUDIO`, `FIREBASE_ROOT_KIDS_TERMINAL`.
- GitHub Pages deploys run `scripts/build-studio-config.mjs` to inject Firebase config into `apps/studio/studio.config.local.js` (gitignored) from repository secrets.
- See `SECRETS.md` for the full runbook.

## Family Hub boundaries

- One owner account per household (Firebase Auth email/password). Children are profiles, not accounts.
- The device PIN is local-only (salted PBKDF2 in `localStorage`). It protects parent mode on the trusted iPad; it is not the Firebase password.
- Parent-mode actions: add/edit/remove members, tasks, checklists, events; export/clear data; change settings.
- Firebase data lives under `familyHub/households/{ownerUid}/` and is isolated from `studio` and `kids-terminal`.
- Generate `apps/family-hub/family.config.local.js` from infisical: `MSYS_NO_PATHCONV=1 infisical export --projectId=90b0e7ef-3f72-4ddb-b888-055e90e13dfa --env=dev --path=/arh-family-lab/family-hub --format=dotenv` and convert to a JS file that assigns to `window.FAMILY_HUB_CONFIG_LOCAL`, or run the generation command in `SETUP.md`.
- Verify UI flows by rehearsing against the rendered page, not just by reading code or state.

## Local Commands

```
python3 -m http.server 4173
```

No build step is required.
