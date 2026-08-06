# Family Hub — Shared Household iPad Pilot

A shared, touch-first daily dashboard and task hub designed for household tablets and phones.

## Features

- **Today Dashboard**: Date/time, next activity countdown, family member avatar selector.
- **3-Tap Child Action**: Instant task completion with sound chimes and zero login friction.
- **Leaving-Home Checklists**: Quick checklists for school, sports, and family outings.
- **Parent PIN Mode**: Local 4–8 digit PIN created during setup for sensitive actions on the trusted device.
- **Bilingual**: Toggle between Bahasa Melayu and English.
- **No-Build Hosted App**: Static HTML5/CSS/JS linking `shared/theme.css`.

## Setup

No build step is required for the hosted shared-display PWA. Open `apps/family-hub/index.html` in any browser or launch via local HTTP server (`python3 -m http.server 4173`).

The separate `apps/family-hub/mobile/` scaffold introduces a deterministic build only for Android and iOS packaging; it does not replace the hosted PWA.
