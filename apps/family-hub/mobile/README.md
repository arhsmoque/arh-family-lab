# Family Hub Mobile

This directory packages the existing Family Hub web application into a Capacitor container while keeping the hosted shared-display PWA intact.

## Contract-stage validation

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run build:web
npm run validate
npm test
```

`build:web` copies the existing static Family Hub into `dist/` and bundles the mobile bootstrap with esbuild. The bundled output is required because Capacitor plugin packages are imported as JavaScript modules and cannot be shipped as unresolved browser bare imports.

## Native bootstrap

Set the final app ID in `capacitor.config.json`, then generate platforms:

```bash
npm run native:add:android
npm run native:add:ios
npm run native:sync
```

The repository bootstrap scripts perform the same guarded sequence and reject placeholder application IDs.

## Important

- Do not generate a production build with `com.arh.familylab.placeholder`.
- Do not store Firebase service credentials in the mobile web bundle.
- `Preferences` is for lightweight settings, not the household database or operation log.
- Generated `android/` and `ios/` projects become maintained source directories.
- Commit a reviewed `package-lock.json` before native containers become a release dependency.
