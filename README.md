# arh-family-lab

A hub of small, static, no-build-step web apps for family & friends, plus a separate clinical/presentation lab. `index.html` links out to each app; `clinical.html` links out to the clinical artifacts.

**Live:**

- GitHub Pages: https://arhsmoque.github.io/arh-family-lab/
- Cloudflare Pages: https://arh-family-lab.pages.dev

Both deploy automatically on every push to `main`.

## Tech stack

- **Frontend**: plain HTML5 / CSS3 / vanilla JS (ES modules), no framework, no bundler. Shared look-and-feel via `shared/theme.css`; shared runtime (config, auth, db, UI helpers) via `shared/runtime/*`, loaded through a small plugin-host contract (see `ARCHITECTURE.md`).
- **Auth / data**: Firebase Authentication (Identity Toolkit REST, no SDK) and Firebase Realtime Database (plain REST calls) for Family Hub and Studio, each isolated under its own root path in one shared Firebase project. Deckmate is local-only (`localStorage`, no account).
- **Local server app**: Node.js/Express (`servers/kids-terminal/`) for Agy Cadet, home-PC only.
- **Kids Grades Garden** (`apps/kids-grades-garden/`, git submodule): its own Firebase-backed app, deployed separately as a Cloudflare Worker.
- **Testing**: Playwright (`@playwright/test`) for end-to-end flow rehearsals across apps.
- **Package management**: pnpm.
- **Hosting/CI**: GitHub Actions deploying to GitHub Pages (`gh-pages` branch) and Cloudflare Pages/Workers via `wrangler`.
- **Secrets**: Infisical as source of truth, synced to GitHub Actions and Cloudflare secrets by `scripts/sync-secrets.mjs`.

## Apps

Family apps live under `apps/<name>/`:

- **[Family Hub](apps/family-hub/)** — a shared household dashboard for the family iPad: today's schedule, child tasks, leaving-home checklists, and parent settings. One owner account (Firebase Auth), device PIN for parent mode, real-time sync across devices via Firebase Realtime Database (isolated `familyHub` path), offline queue, and local audit log. See `apps/family-hub/SETUP.md` before using it.
- **[Deckmate](apps/presentation/)** — a phone-first presentation builder for school. Pick a slide template (title, bullets, image+caption, comparison, timeline, quote), fill it in, reorder, present fullscreen, export to PDF. Decks are saved in the browser (`localStorage`); no account, no backend.
- **[Studio](apps/studio/)** — a personal workspace: sign in (email/password, admin-approved list), organize work into tabbed projects, fill each with resizable note/photo/video cards, pin any card for quick access from the landing page. Backed by the same Firebase Realtime Database as Family Hub (isolated `studio` path), called with plain REST — no SDK. See `apps/studio/SETUP.md` before using it: it needs a few one-time steps in the Firebase console (enable Email/Password auth, paste in API key + database secret, add security rules).
- **[Taman Ilmu](https://arh-kids-grades-garden.arh-homelab.workers.dev/)** (`apps/kids-grades-garden/`, git submodule) — a private family scrapbook: three kids' stories, photos, and SJKC/KAFA results in one place. Own repo (`arh-kids-grades-garden`), own Firebase project, deployed independently as a Cloudflare Worker — not part of this repo's Pages/Cloudflare Pages build.

## Local server apps

Server-backed apps live under `servers/<name>/` and only run on the home PC — they are not part of the static deploy.

- **[Agy Cadet](servers/kids-terminal/)** — a playful kids workspace: speak to Agy, run space math games, and interactive stories. Requires a local Node/Express server — launch it with `run-kids-terminal.bat` from the repo root, then open `http://localhost:3000/servers/kids-terminal/`. First run: copy `servers/kids-terminal/.env.example` to `.env` and fill in the Firebase key (or `infisical export --env=dev --path=/arh-family-lab/kids-terminal --format=dotenv > .env`). The AI backend is switchable without touching code — Settings → AI Backend Provider, type `claude`/`codex`/`kimi`/`mock`/etc.; add new ones under `engine.providers` in `config.json`.

## Design previews

- **[Deckmate + Studio concept](previews/deckmate-studio/)** — isolated, no-data preview for operator and cloud-agent review. It does not replace or mutate either live app. See [`PLATFORM-PROPOSAL.md`](previews/deckmate-studio/PLATFORM-PROPOSAL.md) for the research and recommendation behind a possible multi-user collaborative rebuild.

## Clinical / presentation lab

Clinical artifacts live under `clinical/<name>/` and are linked from [`clinical.html`](clinical.html), separate from the family landing page.

- **[Community CPR v0](clinical/cpr-komuniti-v0/)** — preserved baseline release with a mobile-first interactive HTML guide and a matching downloadable 19-slide projector PPTX under `clinical/cpr-komuniti-v0/downloads/`.
- **[CPR Scenario Lab v1](clinical/cpr-scenario-lab-v1/dist/)** — facilitator-led community CPR rehearsal with four physical learner roles, staged decisions, a compression-rhythm challenge, AED pad placement and a debrief map. React source and the committed static build live together under `clinical/cpr-scenario-lab-v1/`.
- **[ECC CPG Interactive Lab](clinical/ecc-react-lab/dist/)** — full bilingual CPG walkthrough with an interactive tooth-progression lab and a primary-dentition map for marking ECC stages. Built with React and `react-odontogram`; source is in `clinical/ecc-react-lab/` and the static build is committed under `clinical/ecc-react-lab/dist/`.
- **[ECC CPG Briefing](clinical/ecc-cpg-dato-keramat/)** — the published Klinik Pergigian Dato Keramat briefing deck as a static HTML viewer.
- **[Presentation Design Studio](clinical/presentation-design-studio/)** — a reusable presentation canvas prototype. Browser IO lives in `app.js`; pure slide/canvas functions live in `studio-core.js`; content adapters live in `adapters.js`.
- **[ECC Tooth Lab](clinical/ecc-tooth-lab/)** — an interactive HTML teaching prop for ECC progression and tooth-surface explanation.
- **[Realistic ECC Tooth Lab](clinical/ecc-realistic-tooth-lab/)** — a more realistic SVG-based teaching prop using one anatomy-style tooth illustration with enamel, root, gingival margin, lesion overlays and the same presenter flow.
- **[ECC Tooth Lab + Mouth Map](clinical/ecc-tooth-lab-mouth-map/)** — advanced version of the tooth lab with the same tooth model plus an odontogram-style upper primary anterior map for selecting teeth 51, 52, 61 and 62.

## Adding a new app

Each family app lives in its own folder under `apps/<name>/` and stays self-contained (its own `index.html`, JS, CSS). Clinical/professional artifacts go under `clinical/<name>/`; anything needing a local server goes under `servers/<name>/`. Shared look-and-feel lives in `shared/theme.css` — link it rather than redefining colors/fonts, so every app in the hub feels like part of the same family.

Only pull shared logic (storage adapters, auth, sync) out of an app's folder into a common place once a *second* app actually needs it — don't pre-build a generic platform for one tenant. See `ARCHITECTURE.md` for the shared-runtime plugin contract new apps can opt into.

## Local dev

No build step. From the repo root:

```
python3 -m http.server 4173
```

or, with pnpm:

```
pnpm serve
```

Then open `http://localhost:4173`.

## Testing

End-to-end flow rehearsals run with Playwright against the local static server:

```
pnpm test        # headless run
pnpm test:ui     # interactive UI mode
```

## Deploy

- **Cloudflare Pages**: `arh-family-lab.pages.dev`, deployed via `.github/workflows/deploy-cloudflare-pages.yml` on every push to `main`.
- **GitHub Pages**: `arhsmoque.github.io/arh-family-lab`, deployed via `.github/workflows/pages.yml` on every push to `main`.
- Both workflows generate the Firebase-backed apps' local config from GitHub secrets, bundle the site with `scripts/prepare-deploy-bundle.mjs`, and bump the Family Hub service-worker cache name so the PWA auto-updates.

## Secrets & architecture

Secret sourcing, sync targets, and the full deploy pipeline are documented in [`SECRETS.md`](SECRETS.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md). Infisical project `90b0e7ef-3f72-4ddb-b888-055e90e13dfa` is the source of truth; `scripts/sync-secrets.mjs` pushes it out to GitHub Actions and Cloudflare Pages secrets.
