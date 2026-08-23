# Source and Evidence Baseline

## Repository-derived findings

- The current Family Hub application is static HTML, CSS and JavaScript without a package build boundary.
- It already has a manifest and service worker.
- Its store is local-first, queues remote mutations and uses timestamp-based reconciliation.
- Its PIN module uses salted PBKDF2 and rate limiting.
- Its README still states that a default PIN is `1234`, which conflicts with runtime behaviour.

## Current external technical baseline — 7 August 2026

- Capacitor core and CLI stable line used by this scaffold: `8.4.2`.
- Capacitor App plugin: `8.1.1`.
- Capacitor Network plugin: `8.0.1`.
- Capacitor Preferences plugin: `8.0.1`.
- Capacitor Local Notifications plugin: `8.2.1`.
- Android WorkManager stable reference: `2.11.2`.

These versions are recorded for reproducibility. Re-verify them before implementation because mobile toolchains and store requirements change.

## Official-source rationale

- Capacitor can be added to an existing modern web project and provides native plugin bridges.
- Android offline-first guidance recommends a local source of truth and durable queued work, commonly drained through WorkManager.
- Apple LocalAuthentication extends an existing authentication flow; it does not expose biometric data to the application.
- iOS background work is system scheduled and therefore cannot be the correctness foundation.
