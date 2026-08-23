# Family Hub Mobile Scaffold Validation

**Branch:** `agent/family-hub-mobile-scaffold`  
**Base commit:** `3009e5bb3f7488f41f09f229dd7d94ab02c3099c`

## Passed before publication

- 8 JSON files parsed.
- 9 YAML files parsed.
- All JavaScript and MJS files passed `node --check`.
- Shell bootstrap passed `bash -n`.
- Three mobile contract tests passed.
- Placeholder application ID was correctly rejected.
- Capacitor core, CLI, Android and iOS versions are aligned.
- Mobile runtime now uses an esbuild bundle; raw `@capacitor/*` imports are not intended to reach the WebView.

## Validated in the pull-request workflow

The workflow installs the pinned scaffold dependencies, builds the current Family Hub source into `apps/family-hub/mobile/dist`, checks that the bootstrap marker and bundled runtime exist, and runs the contract tests.

## Deliberately blocked

- Android and iOS projects are not generated while the application ID remains `com.arh.familylab.placeholder`.
- Signing, store metadata, notification backend, secure storage choice and widget implementation remain later gates.
- A reviewed `package-lock.json` is required before native generation becomes a release dependency.
