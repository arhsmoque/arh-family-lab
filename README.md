# arh-family-lab

A hub of small, static, no-build-step web apps for family & friends. Deploys to Cloudflare Pages by pointing a project at this repo's root — `index.html` links out to each app.

## Apps

- **[Deckmate](apps/presentation/)** — a phone-first presentation builder for school. Pick a slide template (title, bullets, image+caption, comparison, timeline, quote), fill it in, reorder, present fullscreen, export to PDF. Decks are saved in the browser (`localStorage`); no account, no backend.

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

Create a Cloudflare Pages project pointed at this repo, root directory `/`, no build command, output directory `/`.
