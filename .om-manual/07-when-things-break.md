# 7. arh-family-lab — when things break

_Where to look when something goes wrong: logs, history, and recovery notes found in the project. Generated directly from project records._

## Logs and records this project works with

_No log or JSONL files were found in the project tree at generation time. Check the operating chapter for where the project writes its output._

## Recovery and rollback notes found in the project

- `.agents/skills/arh-cloudflare-wrangler-deploy/references/supabase-ci-migration.md:67` — RLS correctness, or rollback consequences before merge.
- `apps/kids-grades-garden/pnpm-workspace.yaml:22` — - '@firebase/firestore-compat@0.4.12'
- `apps/kids-grades-garden/pnpm-workspace.yaml:23` — - '@firebase/firestore@4.17.0'

## Change history (for undoing mistakes)

The project is tracked by git. To see what changed recently:

```bash
git -C "D:/ARH-GITHUB/arh-family-lab" log --oneline -n 20 -- "D:\ARH-GITHUB\arh-family-lab"
```

