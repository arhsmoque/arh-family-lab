/*
  Placeholder config — fill these in from your Firebase console, then this
  file is safe to commit. The Web API key is public-by-design (it appears
  in every request the browser makes; access is enforced by Realtime
  Database security rules, not by hiding this file). Real secrets —
  dev.pin and dev.dbSecret — must NOT be committed here: put them in the
  gitignored studio.config.local.js (see SETUP.md "Secrets").

  Where to find each value (console.firebase.google.com → your project):
    - firebase.url / firebase.root : same Realtime Database as the homestay
      app (see property.config.js), but a *different* root ("studio") so
      the two apps' data never mix.
    - auth.apiKey : Project settings → General → "Web API Key". (The plain
      REST auth calls only need this key — no authDomain or SDK config.)

  You also need to, once, in the Firebase console:
    1. Authentication → Sign-in method → enable "Email/Password".
    2. Realtime Database → Rules → merge in the rules from SETUP.md
       (only add the "studio" subtree — don't replace the homestay rules).
*/
const STUDIO_APP_CONFIG = {
  firebase: {
    url: "https://arh-firebase-db-default-rtdb.asia-southeast1.firebasedatabase.app",
    root: "studio",
  },
  auth: {
    apiKey: "AIzaSyD7PzpBG9fk3BGM96vYOyKDaaOe3FDFnnY",
  },
  security: {
    // Registration gate. false = OPEN: anyone can sign up and get a
    // workspace (no allowlist check). true = GATED: only emails approved
    // in dev.html can sign up. The dev console can also flip this live via
    // studio/config/registrationGate in the database, which wins over this
    // file value. The deployed security rules must match the gate state —
    // see the two rules variants in SETUP.md.
    registrationGate: false,
  },
  limits: {
    maxImageBytes: 500 * 1024, // 500KB per photo card
    maxUserBytes: 10 * 1024 * 1024, // 10MB per user, soft-checked client-side
  },
  /*
    dev.html only — never referenced from index.html/app.js. This grants
    full read/write to the whole database, bypassing every security rule.
    Keep dev.html's URL private (don't link it from the public app, don't
    share it). See SETUP.md for where to get the database secret and for
    the tradeoffs of this approach.

    Leave the REPLACE_WITH_* placeholders in this committed file and put
    the real values in studio.config.local.js (gitignored) instead:
      const STUDIO_APP_CONFIG_LOCAL = { dev: { pin: "...", dbSecret: "..." } };
  */
  dev: {
    pin: "REPLACE_WITH_A_PIN",
    dbSecret: "REPLACE_WITH_DATABASE_SECRET",
  },
};
