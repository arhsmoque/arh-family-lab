# Deckmate + Studio → a collaborative study platform

Research and recommendation for the idea: merge Deckmate (presentation builder) and Studio
(personal workspace) into one product where people create projects, invite each other by public
username, collaborate, and a small set of admin/dev tooling (approvals, health checks) sits
behind it. Written after inspecting four candidate repos the operator flagged as possible
starting points.

**Status:** proposal only. Nothing in this document changes the live Deckmate or Studio apps.

---

## 1. The doctrine conflict, stated up front

This repo's own `AGENTS.md` is explicit: *"Keep apps self-contained... this hub favors
lightweight seams over speculative platform-building"* — no framework, no build step, no
accounts-as-a-service. What's being asked for here — public usernames, invitations, roles,
project membership, an admin approval queue, dev/ops modules — **is** a real multi-tenant
platform with a database, background jobs, and an authorization layer. That's a good idea; it's
just not the same kind of thing as the rest of `arh-family-lab`.

Recommendation: build it as a **new, separate repository** (e.g. `arh-study-collab` or keep the
`deckmate-studio` name), not as a fifth `apps/*` folder here. `arh-family-lab` keeps its existing
no-account Deckmate and no-frills Studio exactly as they are — they're still the right tool for
"quick, local, no sign-up" use. The new platform is the grown-up sibling for real collaboration.
This doc treats that as the target; §7 covers what (if anything) changes here in the meantime.

---

## 2. What was inspected

All four repos were shallow-cloned and read directly (composer.json, README, top-level
structure) — no code was copied.

| Repo | Stack | License | What it actually is |
|---|---|---|---|
| [`WendellAdriel/slidewire`](https://github.com/WendellAdriel/slidewire) | Laravel package (Livewire, Phiki) | MIT | A real presentation-deck **engine**: full-page Livewire rendering, keyboard/swipe/hash navigation, nested vertical slide groups, fragments, auto-animate, timed auto-advance, syntax-highlighted code slides, theme presets. This is a more capable Deckmate core than what's in `apps/presentation/` today — worth building on, not just referencing. |
| [`jeffersongoncalves/filafluxkitv5`](https://github.com/jeffersongoncalves/filafluxkitv5) | Laravel 13 + Filament 5 + Livewire 4/Flux | MIT | A **starter kit**, not a feature set: pre-wired **three-panel structure** — `/admin` (system administrators), `/app` (authenticated users), guest/public frontend — with **separate multi-guard auth** (distinct `Admin` and `User` models/tables/login pages). This maps almost exactly onto "an admin page for me for approval" vs. everyone else's workspace, for free, out of the box. |
| [`liberusoftware/boilerplate-laravel`](https://github.com/liberusoftware/boilerplate-laravel) | Laravel 13 + Filament 5 + Jetstream, modular (`liberu-module` Composer packages) | MIT | Not an app — a **composable catalog**. The pieces that matter for this idea: `organisations-teams` (+ `-filament`), `roles-permissions` (+ `-filament`), `notifications`, `audit`, `feature-flags`, `sessions-devices` (+ `-filament`), `search`, `import-export`, plus ops packages already wired in (Horizon, Pulse, Telescope, Reverb, backup). Each is independently versioned and can be required à la carte — you don't have to take the whole boilerplate to get the teams/invites/audit pieces. |
| [`titustum/customizable-college-website`](https://github.com/titustum/customizable-college-website) | Laravel 13 + Filament 5 + Livewire 4 | README says MIT, **no LICENSE file committed** — confirm with the author before reusing anything beyond ideas | A finished **content site**, not a platform: departments/programs/courses, staff profiles, tenders/vacancies, news/events, student application form. Useful as a domain reference for "what does a school/college data model look like," not as a base to fork — its admin panel is single-tenant CMS-shaped, not multi-user-collaboration-shaped. |

### Recommendation: fork one, take capabilities from the others

- **Fork `slidewire`** as the presentation engine — it's a stronger Deckmate than what exists now
  (nested slides, fragments, themes, code highlighting) and it's a Livewire *package*, so it drops
  into any Laravel app rather than being a full app you'd have to strip down.
- **Scaffold the app itself from `filafluxkitv5`** — its Admin/App/Guest panel split and
  multi-guard auth is the shortest path to "an admin page for me for approval" without building
  an auth system from scratch.
- **Cherry-pick from `boilerplate-laravel`**: `organisations-teams(-filament)` for projects as
  teams, `roles-permissions(-filament)` for owner/editor/viewer roles inside a project,
  `notifications` for invite emails/in-app alerts, `audit` for an activity log per project,
  `sessions-devices(-filament)` for "sign out other devices," `feature-flags` for gating new
  modules per user while you build them out.
- **Mine `customizable-college-website`** only for domain modeling ideas (subjects, classes,
  staff/teacher vs. student roles) if the study-app extension (§6) goes down a school-account
  route later. Don't fork it.

---

## 3. Mapping the ask to concrete building blocks

| You said | Concrete piece |
|---|---|
| Public usernames people can find each other by | `identity-core` / `profiles` (liberu) — public `username` field distinct from login email, a "find people" search backed by `search` |
| Create a project, invite others | `organisations-teams` module: a project *is* a team; invites are a `team_invitations` table with `pending / accepted / declined / expired` status, keyed to the invitee's username or email |
| Invitation accepted → shared collaboration | `roles-permissions` scoped to the team: `owner`, `editor`, `viewer` on a project; slidewire decks and Studio-style note boards both live under the project, visible to all accepted members per their role |
| Admin page for you, for approval | `filafluxkitv5`'s `/admin` Filament panel, multi-guard so it's a genuinely separate login from regular users — new-user approval queue is a Filament resource with an `approved_at` column and a bulk-approve action |
| Dev modules like health checks | `spatie/laravel-health` (or Filament's own health-check plugin) wired into the admin panel, plus `laravel/pulse` (already a boilerplate-laravel dependency) for request/queue/job metrics, `audit` for who-did-what, `feature-flags` for staged rollout of new modules |
| Deckmate concept | `slidewire`-powered deck editor, scoped to a project, co-editable by project members |
| Studio concept | project-scoped note/photo/link board (the existing pinboard metaphor in `previews/deckmate-studio/`, carried over as a Livewire component instead of the current localStorage/Firebase version) |

---

## 4. Sketch: data model

```text
users            id, username (unique, public), email, password, approved_at, is_admin
teams            id, name, slug                          -- "project" in product language
team_members     team_id, user_id, role (owner|editor|viewer), joined_at
team_invitations id, team_id, inviter_id, invitee_username, status, token, expires_at
decks            id, team_id, title, slidewire payload, updated_by, updated_at
deck_slides      id, deck_id, order, blade/markdown content, theme
study_cards      id, team_id, type (note|photo|link), body, pinned_by[], created_by
audit_log        id, team_id, user_id, action, subject_type, subject_id, created_at
```

`users.approved_at` is the whole admin-approval feature: null = pending, Filament admin
resource lists pending users, one action sets it. Registration gate behavior can mirror what
Studio already does today (open vs. gated, flip-able live) — that pattern from
`apps/studio/SETUP.md` is worth keeping as-is, just re-implemented against a real users table
instead of a Firebase allowlist node.

---

## 5. Suggested phasing

1. **Skeleton** — `laravel new --using=jeffersongoncalves/filafluxkitv5`, wire the admin/app/guest
   panels, get username-based public profiles working, no collaboration yet.
2. **Projects & invites** — `organisations-teams` + `roles-permissions`, invite-by-username flow,
   accept/decline, project membership list.
3. **Deckmate inside a project** — require `wendelladriel/slidewire`, build a project-scoped deck
   editor on top of it (multi-editor concurrency can start simple — last-write-wins with an
   updated-by/updated-at banner — before investing in real-time co-editing).
4. **Studio inside a project** — port the pinboard concept from
   `previews/deckmate-studio/` into a Livewire component, project-scoped instead of per-user.
5. **Admin & ops** — approval queue, audit log, health-check panel, feature flags.
6. **Study-app extension** (see §6) once the collaboration core is solid.

Steps 1–3 are the smallest slice that proves the concept end to end (sign up → get approved →
create a project → invite a friend → both edit a deck together).

---

## 6. Beyond Studio: a personal study app for school kids

Studio today is "a personal workspace with a pinboard." The natural extension, once projects and
collaboration exist, is a study-specific layer on top — things a college-website starter kit
doesn't give you but the domain (school kids) calls for:

- **Subject folders with spaced repetition** — turn pinned notes into simple flashcards; a
  lightweight SM-2 scheduler is a small, self-contained module, no new dependency needed.
- **Presentation practice mode** — pair with the slidewire deck: a rehearsal timer, "explain this
  slide out loud" prompts, and a private note-to-self field per slide (distinct from the shared
  deck content).
- **Homework/assignment tracker** — due dates surfaced per project, small enough to be a
  `study_cards` variant (`type: task`) rather than a new subsystem.
- **Guardian/teacher view** — a *read-only* role variant of `roles-permissions`, so a parent or
  teacher can be invited into a project to see progress without editing it — reuses the same
  invite mechanism, just a role that lacks write grants.
- **Offline-first** — the existing family-lab apps already lean on `localStorage`/service
  workers; a PWA shell with background sync would let the new platform work the same way on a
  spotty school wifi connection.
- **Light gamification** — streaks/badges for decks finished or study sessions logged, scoped
  per-user so it doesn't turn into a leaderboard between kids unless a family opts in.

None of this needs new infrastructure beyond what §3–5 already sets up — it's schema and Filament
resources on the same `teams`/`study_cards` foundation, added once the core collaboration loop is
proven.

---

## 7. What (if anything) changes in *this* repo right now

Nothing. `apps/presentation/` (Deckmate) and `apps/studio/` (Studio) stay as they are — local-only
deck builder, Firebase-allowlist workspace. They remain the right answer for "one person, no
sign-up, works instantly." If/when the new platform ships, this repo's `index.html` hub can grow
a link out to it, the same way it already links out to `apps/kids-grades-garden` (a separate repo
deployed independently). `previews/deckmate-studio/` keeps serving as the shared visual language
reference — the tab-switcher concept and pinboard/deck-story metaphors in that preview transfer
directly into the new platform's UI.

## 8. Open decisions for the operator

- New repo name and whether it lives under the same GitHub account/org as the rest of the lab.
- Hosting: Laravel needs a real host (PHP + a SQL database + a queue worker for notifications/
  Horizon), unlike the current static-only deploy — Cloudflare Pages/GitHub Pages won't run it.
  A small VPS or a managed Laravel host (Forge, Vapor, or a Docker box) is the next question once
  this direction is confirmed.
- Whether project invites are username-only (simplest, matches "usernames are public") or also
  accept email for inviting someone not yet registered.
- Whether admin approval is required for *all* new users at launch, or only gated once the
  platform is public — Studio's existing open/gated toggle pattern is worth carrying over either
  way.
