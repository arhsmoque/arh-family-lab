# Mobile Architecture Decisions

## ADR-001 — Preserve the shared-display PWA

The household tablet remains a PWA surface. It is not replaced by the personal mobile application.

## ADR-002 — Capacitor before full native presentation

Use a Capacitor shell for Android and iOS distribution after the shared contracts and personal mobile composition exist. Native UI is introduced only through evidence-backed escape hatches.

## ADR-003 — Local state remains the correctness foundation

Background execution is opportunistic. The app must remain locally correct when WorkManager or BackgroundTasks has not run.

## ADR-004 — Separate account identity from parent re-authorisation

Account authentication proves household membership. Biometrics or device credentials re-authorise a protected action on an already authenticated personal device. Shared tablets retain an app PIN fallback.

## ADR-005 — Widgets consume projections

Widgets read a small prepared snapshot. They do not independently load, reconcile or expose the full household database.

## ADR-006 — Native folders become maintained adapters

After `npx cap add android` or `npx cap add ios`, generated projects are committed and maintained. They are not disposable build output.

## ADR-007 — Application ID is a release invariant

`com.arh.familylab.placeholder` is intentionally invalid for production. Bootstrap blocks native generation until an explicit application ID is supplied.
