# iOS Native Reference Seams

These files are reference stubs. Move them into generated Xcode targets only after the final bundle identifier and targets are known.

Initial seams:

- `ParentAuthorisation.swift` — LocalAuthentication re-authorisation.
- `BackgroundSyncCoordinator.swift` — BackgroundTasks registration and best-effort queue drain.
- `FamilyWidgetSnapshot.swift` — WidgetKit projection model.

The local operation log remains the correctness foundation.
