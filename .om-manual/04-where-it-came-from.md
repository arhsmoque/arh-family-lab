# 4. arh-family-lab — where it came from

_What was ported or adapted from elsewhere, and the project's own history. Generated directly from project records._

## Ported and adapted code

The following lines state that code or design was ported or adapted from elsewhere (quoted verbatim):

- `.agents/skills/arh-cloudflare-wrangler-deploy/SKILL.md:14` — local machine holding a `wrangler login` session or an exported token.
- `SECRETS.md:147` — Required GitHub secrets for the cloud path: `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`. `INFISICAL_TOKEN` is supported only for local runs; the cloud workflow does not use it.
- `apps/family-hub/core/audit-log.js:2` — // Events are stored locally and can be exported by the parent.
- `apps/presentation/slide-renderer.js:77` — return `<p class="muted">${esc(L.unsupported)}</p>`;
- `clinical/cpr-komuniti-v0/qrcode.js:1763` — throw 'sjis not supported.';
- `clinical/cpr-komuniti-v0/qrcode.js:1769` — throw 'sjis not supported.';
- `clinical/presentation-design-studio/adapters.js:11` — return createCanvas({title: "Unsupported input", slides: [normalizeSlide({title: "Unsupported adapter", blocks: [{type: "text", value: kind}]})]});
- `clinical/presentation-design-studio/app.js:107` — setStatus("exported");
- `tests/baseline.spec.js:44` — if (!('serviceWorker' in navigator)) return { supported: false };
- `tests/baseline.spec.js:52` — expect(swState.supported).toBe(true);

## Project history

This project lives inside the git repository at `D:/ARH-GITHUB/arh-family-lab`. Recent changes touching this project (newest first):

```
fd85956 feat(deckmate): align with plugin-host contract and add manifest/config
5d0d830 fix(family-hub): replace native dialogs with in-app modal; cache-bust Studio config
cb9fab6 fix(kids-terminal): stop leaking parent PIN, dynamic test port, safe local cache
f229bd3 test(kids-terminal): add AGY_TEST_MODE bypass and end-to-end rehearsal
490ef08 test: add flow-of-events rehearsals for Deckmate, Family Hub, Studio
78010a4 ci(sync-secrets): allow INFISICAL_TOKEN fallback for cloud runs
14a2e12 refactor(kids-terminal): use shared runtime auth/db via bridge
689e30a refactor(family-hub): use shared runtime auth/db via bridge
12d751a refactor(studio): use shared runtime auth/db via bridge
f273492 feat(runtime): add store plugin and app manifests
cd051fd feat(runtime): shared plugin foundation
fbc5c56 ci(deploy): let pnpm/action-setup read version from package.json
b0b5845 ci(deploy): install pnpm before wrangler-action
5e9f05c feat(secrets): sync Cloudflare credentials from Infisical to GitHub
9a70266 fix(family-hub): load local config before base, add SW update flow, harden CI
3009e5b Merge branch 'main' of https://github.com/arhsmoque/arh-family-lab
59bcb8f revert(family-hub): restore service worker cache name to v1
559196e Merge pull request #10 from arhsmoque/dependabot/npm_and_yarn/clinical/cpr-scenario-lab-v1/postcss-8.5.26
85b7f74 ci(deploy): version Family Hub service worker cache per deploy
bd63bb0 fix(secrets): use Infisical HTTP API in sync script
87cd379 feat(secrets): support Infisical Machine Identity in sync workflow
4ac616c fix(family-hub): bump service worker cache to v2
97c37bb ci(pages): deploy via gh-pages branch instead of actions/deploy-pages
037a4eb ci(deploy): upload lean dist/ bundle to Pages
a24a200 ci(pages): revert to deploy-pages@v4 and upload-pages-artifact@v3
d7ef3f5 ci(pages): try deploy-pages@v3 to work around hang
3967b7c chore: trigger Pages deploy
487ee2e fix(deploy): inject Family Hub config in both Pages workflows
ad77c46 ci(deploy): add Cloudflare Pages auto-deploy and cloud-agent secret sync
425f41b chore(deps): bump postcss in /clinical/cpr-scenario-lab-v1
```

