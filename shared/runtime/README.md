# Shared Runtime

Opt-in ES-module plugins used by apps in this hub. The goal is to stop
copy-pasting Firebase auth/REST code across Family Hub, Studio, and Kids
Terminal, and to give new apps a clear onboarding path.

## Plugins

| Module | Purpose |
|---|---|
| `config.js` | Load base config + gitignored local override |
| `auth.js` | Firebase Identity Toolkit REST auth |
| `db.js` | Firebase Realtime Database REST layer |
| `store.js` | Generic `localStorage` cache + sync queue |
| `ui.js` | Modal, toast, HTML escape helpers |
| `plugin-host.js` | Manifest-driven app bootstrap |

## App contract

1. Create `apps/<name>/manifest.json`:
   ```json
   {
     "name": "my-app",
     "title": "My App",
     "entry": "./app.js",
     "plugins": ["config", "auth", "db"],
     "configKey": "MY_APP_CONFIG"
   }
   ```
2. `index.html` loads `shared/theme.css` and `shared/runtime/plugin-host.js` as a module.
3. `app.js` exports a `mount({ manifest, plugins })` function.

Existing apps that still use classic scripts continue to work; migration is
opt-in per app.
