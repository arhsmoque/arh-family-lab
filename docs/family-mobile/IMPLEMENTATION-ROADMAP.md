# Implementation Roadmap

## Gate 0 — Repository branch and trace

- Create a dedicated branch.
- Record the current Family Hub source baseline.
- Correct the stale README statement about a default PIN.

## Gate 1 — Shared contracts

- Introduce domain, operation-log, trust and platform-port packages.
- Add stable operation IDs and deletion tombstones.
- Separate `saved_local`, `syncing`, `synced_remote`, `offline_pending`, `conflict` and `rejected`.

## Gate 2 — Deterministic web build

- Copy the current static app into `mobile/dist` through `build-web.mjs`.
- Inject mobile bootstrap only into the packaged mobile build.
- Keep the hosted PWA path unchanged.

## Gate 3 — Personal mobile composition

- Add a personal Today surface.
- Avoid shrinking the shared dashboard into a phone viewport.
- Preserve semantic routes for Today, member, task, checklist and parent attention.

## Gate 4 — Native containers

- Confirm final application ID.
- Install dependencies.
- Generate Android and iOS projects.
- Commit them as maintained adapters.

## Gate 5 — Lifecycle and deep links

- Handle foreground/background transitions.
- Resolve semantic deep links through authentication and authority checks.
- Fall back safely when an object was deleted or belongs to another household.

## Gate 6 — Notifications

- Ask in context after the user creates a timed routine.
- Begin with local reminders.
- Treat notification payloads as stale hints, never as source of truth.

## Gate 7 — Parent re-authorisation

- Android: biometric or device credential through a native bridge.
- iOS: LocalAuthentication.
- Preserve app PIN and account re-authentication fallbacks.

## Gate 8 — Durable synchronisation

- Android: unique WorkManager work drains the persisted operation log.
- iOS: BackgroundTasks assists eventual synchronisation.
- Foreground launch always remains capable of draining the queue.

## Gate 9 — Widgets

- Prepare privacy-safe snapshots.
- Add Android and WidgetKit projections.
- Deep-link into current application state.

## Gate 10 — Release readiness

- Confirm identifiers, signing, privacy manifests, permissions, store metadata and deletion/account policies.
- Run adaptive, offline, notification, background and widget test matrices.
