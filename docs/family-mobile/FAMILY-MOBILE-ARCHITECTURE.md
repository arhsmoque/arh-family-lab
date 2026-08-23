# Family Mobile Architecture

```text
shared domain + trust + operation log
              ↓
personal mobile web composition
              ↓
bundled Capacitor web runtime
              ↓
Capacitor Android / iOS containers
              ↓
focused native seams
```

The shared-display PWA and personal mobile application are coordinated surfaces, not duplicate layouts.

The hosted Family Hub remains static and build-free. Only the mobile distribution path introduces a deterministic build boundary. The mobile bootstrap is bundled so Capacitor plugin imports resolve before `npx cap sync` copies the web assets into native projects.
