/*
  Placeholder config — fill these in from your Firebase console, then this
  file is safe to commit (none of these values are secret; access is
  enforced by Realtime Database security rules, not by hiding this file).

  Where to find each value (console.firebase.google.com → your project):
    - firebase.url / firebase.root : same Realtime Database as the homestay
      app (see property.config.js), but a *different* root ("studio") so
      the two apps' data never mix.
    - auth.apiKey : Project settings → General → "Web API Key".
    - auth.authDomain : Project settings → General → your project's
      "<project-id>.firebaseapp.com" value.

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
    apiKey: "REPLACE_WITH_WEB_API_KEY",
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
  */
  dev: {
    pin: "REPLACE_WITH_A_PIN",
    dbSecret: "REPLACE_WITH_DATABASE_SECRET",
  },
};
