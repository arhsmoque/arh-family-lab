# AGENTS.md - arh-family-lab

A hub of small, static, ad-hoc web apps for family & friends. Each app is a separate tenant under `apps/<name>/`.

## Artifact Contract

- Surface: static webapp, no build step.
- Risk class: local mutation by default; external mutation for deployment or repository push.
- Canonical hub entry: `index.html`.
- Shared design tokens: `shared/theme.css`.
- Current apps: `apps/presentation/` (Deckmate — school presentation builder).

## Doctrine Notes

- Verify before claiming completion; do not deploy or push without explicit authority.
- Keep apps self-contained. Don't generalize shared logic (storage, auth, sync) across apps until a second app actually needs it — this hub favors lightweight seams over speculative platform-building.
- New apps should link `shared/theme.css` rather than redefining the palette/fonts, so the hub feels consistent.

## Local Commands

```
python3 -m http.server 4173
```

No build step is required.
