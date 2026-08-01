# Studio — Firebase setup

Studio reuses the same Firebase project as the homestay app (`arh-firebase-db`), in an isolated `studio` path. Nothing here touches homestay data.

## One-time console steps (console.firebase.google.com)

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Project settings → General** → copy the **Web API Key** → paste into `studio.config.js` as `auth.apiKey`.
3. **Project settings → Service accounts → Database secrets** (sometimes shown as "legacy secrets") → generate/copy a secret → put it in **`studio.config.local.js`** as `dev.dbSecret` (see "Secrets" below — do NOT commit it into `studio.config.js`). This key grants full read/write to the *entire* database, bypassing all rules — it's only ever used from `dev.html`, never from the public app.
4. Pick a PIN for `dev.pin`, also in `studio.config.local.js` (this gates `dev.html`, same pattern as `admin.html`'s owner/developer PIN).
5. **Realtime Database → Rules** → merge one of the two variants below into your existing rules (add the `"studio"` key alongside whatever's already there for the homestay app — don't replace the whole tree). **Which variant depends on the registration gate** — see the next section.

## The registration gate (open vs gated)

The gate controls who may sign up:

- **OPEN (default)** — `security.registrationGate: false` in `studio.config.js`. Anyone can register with any email; their profile is created automatically (alias = the part before `@`) and they land straight in their workspace. Use this while you're getting everyone set up.
- **GATED** — only emails you approved in `dev.html` (Approved emails tab) can get in; everyone else is signed straight back out with a friendly message.

You can flip the gate **live, without redeploying**: `dev.html → Settings tab → "Open/Close the gate"`. That writes `studio/config/registrationGate` in the database, which the app reads first; it falls back to the `studio.config.js` value when the DB flag is unset or unreadable.

**Important: the deployed security rules must match the gate state.** With the gate open, the allowlist clause on `studio/users/$uid` would block brand-new (unapproved) users from writing their own profile — the classic "stuck at the auth page" symptom. Paste the variant that matches:

### Rules variant A — gate OPEN (paste this while the gate is open)

```json
{
  "rules": {
    "studio": {
      "config": {
        ".read": "auth != null",
        ".write": false
      },
      "allowlist": {
        "$emailKey": {
          ".read": "auth != null && auth.token.email.toLowerCase().replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',') === $emailKey",
          ".write": false
        }
      },
      "users": {
        "$uid": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": "auth != null && auth.uid === $uid",
          "profile": {
            "email": { ".validate": "newData.val() === auth.token.email" }
          },
          "cards": {
            "$projectId": {
              "$cardId": {
                "imageData": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length < 700000)" }
              }
            }
          }
        }
      }
    }
  }
}
```

### Rules variant B — gate CLOSED (paste this when you toggle the gate on)

```json
{
  "rules": {
    "studio": {
      "config": {
        ".read": "auth != null",
        ".write": false
      },
      "allowlist": {
        "$emailKey": {
          ".read": "auth != null && auth.token.email.toLowerCase().replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',') === $emailKey",
          ".write": false
        }
      },
      "users": {
        "$uid": {
          ".read": "auth != null && auth.uid === $uid && root.child('studio/allowlist/' + auth.token.email.toLowerCase().replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',')).exists()",
          ".write": "auth != null && auth.uid === $uid && root.child('studio/allowlist/' + auth.token.email.toLowerCase().replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',')).exists()",
          "profile": {
            "email": { ".validate": "newData.val() === auth.token.email" }
          },
          "cards": {
            "$projectId": {
              "$cardId": {
                "imageData": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length < 700000)" }
              }
            }
          }
        }
      }
    }
  }
}
```

What both variants enforce: a signed-in user can only ever read/write their **own** `studio/users/{their uid}` subtree. Nobody — not even a signed-in user — can read or write the allowlist itself (except their own single entry, to check they're approved); only the dev-console secret can add/remove entries. The `config` node (just the gate flag) is readable by any signed-in user but writable only via the dev-console secret. A profile's `email` field can't be spoofed to someone else's address. Photo cards are capped at ~700KB of base64 (≈500KB image) at the database-rule level, not just client-side. Variant B additionally requires the user's email to be on the allowlist before they can touch their own subtree.

6. With the gate **open** (default), users can just sign up in the app — no pre-approval needed. With the gate **closed**, approve each email first via `dev.html` (Approved emails tab) before they sign up — sign-up on an unapproved email is allowed by Firebase Auth itself but Studio immediately signs it back out.

## Secrets: what goes where

- **`auth.apiKey`** — keep it in the committed `studio.config.js`. Firebase web API keys are public-by-design: they appear in every request the browser makes, and security comes from the Realtime Database rules + App Check, not from hiding the key. (Google's own docs say embedding it in client code is fine.)
- **`dev.pin` and `dev.dbSecret`** — NEVER commit these. Put them in `studio.config.local.js`:
  1. Copy `studio.config.local.js.example` → `studio.config.local.js` (same folder).
  2. Fill in the real PIN and database secret.
  3. Done — `index.html`/`dev.html` load it after `studio.config.js` and merge it in (section-by-section; anything you omit falls back to the committed file). `studio.config.local.js` is listed in the repo root `.gitignore`, so it can't be committed by accident. Keep the `REPLACE_WITH_*` placeholders in the committed `studio.config.js`.

### Infisical (optional)

If the family lab keeps secrets in Infisical, you can generate `studio.config.local.js` from it instead of editing by hand:

```powershell
cd apps/studio
infisical export --env=dev --path=/arh-family-lab/studio --format=dotenv > .env.studio
# expected vars: STUDIO_API_KEY (optional), STUDIO_DEV_PIN, STUDIO_DB_SECRET
./scripts/render-local-config.ps1 -EnvFile .env.studio
```

`scripts/render-local-config.ps1` reads those env vars (from the dotenv file, or already set in your shell) and writes `studio.config.local.js`. Delete `.env.studio` afterwards — it's covered by the `.env.*` gitignore entry, but don't leave secrets lying around.

## Kid-facing notes

- The UI is bilingual EN/BM — a "Bahasa Melayu / English" toggle sits on the auth card and the landing header; the choice persists in localStorage and defaults to the browser language.
- "Forgot password?" on the auth view sends a real Firebase reset email (Identity Toolkit `accounts:sendOobCode`), so the Gmail address used must be able to receive mail.
- If `auth.apiKey` is missing or still a placeholder, the app shows a "Studio isn't set up yet" panel instead of the login form and never attempts auth calls.

## Known tradeoffs (read before relying on this for anything sensitive)

- **`dev.html` is a real backdoor.** Its dbSecret bypasses every rule above. Anyone who loads that page and knows the PIN has full read/write to all users' data. Don't link it from the public app, don't share the URL, consider renaming the file to something unguessable when you deploy, and treat the PIN like a real password.
- **The 10MB-per-user cap is best-effort, not atomic.** It's a read-then-write check from the client, so two uploads racing at the exact same moment could both slip through. Fine for a handful of family/friends; not something to rely on if this ever gets more users than you can build with the DB secret + a click.
- **Images are compressed client-side** (resized + re-encoded as JPEG) to fit under 500KB before upload — the *original* file never leaves the phone at full size.
- **With the gate open, anyone on the internet can register** and use up database space under their own uid. That's the intended "get everyone onboard first" mode — toggle the gate closed (dev.html → Settings) and swap to rules variant B once the family is in.
