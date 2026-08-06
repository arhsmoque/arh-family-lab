# Android Native Reference Seams

These files are reference stubs. Move and adapt them only after Capacitor generates the Android project and the final Java/Kotlin package is known.

Initial seams:

- `ParentAuthorisation.kt` — biometric or device-credential re-authorisation.
- `FamilySyncWorker.kt` — unique WorkManager queue drain.
- `FamilyWidgetSnapshot.kt` — privacy-safe widget data projection.

Do not copy browser business logic into these classes.
