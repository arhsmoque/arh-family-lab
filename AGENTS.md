# AGENTS.md - arh-family-lab

A hub of small, static, ad-hoc web apps for family & friends. Each app is a separate tenant under its category folder.

## Layout

- `apps/` — family static apps (no build step): `apps/family-hub/` (Family Hub — shared household iPad dashboard), `apps/presentation/` (Deckmate — school presentation builder), `apps/studio/` (personal workspace, Firebase-backed).
- `servers/` — local server-backed apps, home PC only, not part of the static deploy: `servers/kids-terminal/` (Agy Cadet — Node/Express, launch via `run-kids-terminal.bat`).
- `clinical/` — clinical/professional artifacts linked from `clinical.html`: `cpr-komuniti-v0`, `cpr-scenario-lab-v1`, `ecc-cpg-dato-keramat`, `ecc-react-lab`, `ecc-tooth-lab`, `ecc-realistic-tooth-lab`, `ecc-tooth-lab-mouth-map`, `presentation-design-studio`.
- `previews/` — isolated design mocks for review (e.g. `previews/deckmate-studio/`).

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

## Local Commands

```
python3 -m http.server 4173
```

No build step is required.
