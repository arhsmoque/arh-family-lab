# arh-family-lab

A hub of small, static, no-build-step web apps for family & friends. Deploys to Cloudflare Pages by pointing a project at this repo's root — `index.html` links out to each app.

## Apps

- **[Deckmate](apps/presentation/)** — a phone-first presentation builder for school. Pick a slide template (title, bullets, image+caption, comparison, timeline, quote), fill it in, reorder, present fullscreen, export to PDF. Decks are saved in the browser (`localStorage`); no account, no backend.
- **[Studio](apps/studio/)** — a personal workspace: sign in (email/password, admin-approved list), organize work into tabbed projects, fill each with resizable note/photo/video cards, pin any card for quick access from the landing page. Backed by the same Firebase Realtime Database as the homestay app (isolated `studio` path), called with plain REST — no SDK. See `apps/studio/SETUP.md` before using it: it needs a few one-time steps in the Firebase console (enable Email/Password auth, paste in API key + database secret, add security rules).

## Design previews

- **[Deckmate + Studio concept](previews/deckmate-studio/)** — isolated, no-data preview for operator and cloud-agent review. It does not replace or mutate either live app.

## Clinical / presentation lab

Clinical artifacts are linked from [`clinical.html`](clinical.html), separate from the family landing page.

- **[CPR Scenario Lab v1](apps/cpr-scenario-lab-v1/dist/)** — facilitator-led community CPR rehearsal with four physical learner roles, staged decisions, a compression-rhythm challenge, AED pad placement and a debrief map. React source and the committed static build live together under `apps/cpr-scenario-lab-v1/`.
- **[ECC CPG Interactive Lab](apps/ecc-react-lab/dist/)** — full bilingual CPG walkthrough with an interactive tooth-progression lab and a primary-dentition map for marking ECC stages. Built with React and `react-odontogram`; source is in `apps/ecc-react-lab/` and the static build is committed under `apps/ecc-react-lab/dist/`.
- **[ECC CPG Briefing](apps/ecc-cpg-dato-keramat/)** - the published Klinik Pergigian Dato Keramat briefing deck as a static HTML viewer.
- **[Presentation Design Studio](apps/presentation-design-studio/)** - a reusable presentation canvas prototype. Browser IO lives in `app.js`; pure slide/canvas functions live in `studio-core.js`; content adapters live in `adapters.js`.
- **[ECC Tooth Lab](apps/ecc-tooth-lab/)** - an interactive HTML teaching prop for ECC progression and tooth-surface explanation.
- **[Realistic ECC Tooth Lab](apps/ecc-realistic-tooth-lab/)** - a more realistic SVG-based teaching prop using one anatomy-style tooth illustration with enamel, root, gingival margin, lesion overlays and the same presenter flow.

## Adding a new app

Each app lives in its own folder under `apps/<name>/` and stays self-contained (its own `index.html`, JS, CSS). Shared look-and-feel lives in `shared/theme.css` — link it rather than redefining colors/fonts, so every app in the hub feels like part of the same family.

Only pull shared logic (storage adapters, auth, sync) out of an app's folder into a common place once a *second* app actually needs it — don't pre-build a generic platform for one tenant.

## Local dev

No build step. From the repo root:

```
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy

- **Cloudflare Pages**: point a project at this repo, root directory `/`, no build command, output directory `/`.
- **GitHub Pages**: pushes to `main` build and deploy automatically via `.github/workflows/pages.yml`. One-time setup: in the repo's Settings → Pages, set Source to "GitHub Actions".
