# Studio — Firebase setup

Studio reuses the same Firebase project as the homestay app (`arh-firebase-db`), in an isolated `studio` path. Nothing here touches homestay data.

## One-time console steps (console.firebase.google.com)

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Project settings → General** → copy the **Web API Key** → paste into `studio.config.js` as `auth.apiKey`.
3. **Realtime Database → Rules** → merge the rules below into your existing rules (add the `"studio"` key alongside whatever's already there — don't replace the whole tree).
4. Set `dev.adminEmail` in `studio.config.js` to whichever email should have full admin access in `dev.html` (defaults to the family's own address). No PIN or database secret to generate — `dev.html` signs in with real Firebase Auth, same as the main app; the rules below are what actually grant that email admin access.

## The registration gate (open vs gated)

The gate controls who may sign up:

- **OPEN (default)** — `security.registrationGate: false` in `studio.config.js`. Anyone can register with any email; their profile is created automatically (alias = the part before `@`) and they land straight in their workspace. Use this while you're getting everyone set up.
- **GATED** — only emails you approved in `dev.html` (Approved emails tab) can get in; everyone else is signed straight back out with a friendly message.

You can flip the gate **live, without redeploying**: `dev.html → Settings tab → "Open/Close the gate"`. That writes `studio/config/registrationGate` in the database, which the app reads first; it falls back to the `studio.config.js` value when the DB flag is unset or unreadable. The rules below work for **both** gate states at once — nothing to swap when you flip it.

### Rules — paste into Realtime Database → Rules

Replace `arh.homelab@gmail.com` with your actual `dev.adminEmail` value.

```json
{
  "rules": {
    "studio": {
      "config": {
        ".read": "auth != null",
        ".write": "auth != null && auth.token.email == 'arh.homelab@gmail.com'"
      },
      "allowlist": {
        ".read": "auth != null && auth.token.email == 'arh.homelab@gmail.com'",
        ".write": "auth != null && auth.token.email == 'arh.homelab@gmail.com'",
        "$emailKey": {
          ".read": "auth != null && (auth.token.email == 'arh.homelab@gmail.com' || auth.token.email.toLowerCase().replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',').replace('.', ',') === $emailKey)"
        }
      },
      "users": {
        ".read": "auth != null && auth.token.email == 'arh.homelab@gmail.com'",
        "$uid": {
          ".read": "auth != null && (auth.uid === $uid || auth.token.email == 'arh.homelab@gmail.com')",
          ".write": "auth != null && (auth.uid === $uid || auth.token.email == 'arh.homelab@gmail.com')",
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

What this enforces: a signed-in user can always read/write their **own** `studio/users/{their uid}` subtree — regardless of gate state, so "stuck at the auth page after signup" can't happen from a rules mismatch. The admin email additionally gets full read/write everywhere under `studio` (that's what powers `dev.html` — approving/revoking emails, listing users, toggling the gate). Nobody else can read or write the allowlist, except checking whether their own single entry exists. A profile's `email` field can't be spoofed to someone else's address. Photo cards are capped at ~700KB of base64 (≈500KB image) at the database-rule level, not just client-side.

With the gate **open** (default), users can just sign up in the app — no pre-approval needed. With the gate **closed**, approve each email first via `dev.html` (Approved emails tab) before they sign up — sign-up on an unapproved email is allowed by Firebase Auth itself but Studio immediately signs it back out.

## Secrets: what goes where

- **`auth.apiKey`** — keep it in the committed `studio.config.js`. Firebase web API keys are public-by-design: they appear in every request the browser makes, and security comes from the Realtime Database rules + App Check, not from hiding the key. (Google's own docs say embedding it in client code is fine.)
- **`dev.adminEmail`** — also fine to commit; it's not a secret, just which email the rules above grant admin access to. The actual credential is that account's real Firebase Auth password, which is never stored in this repo at all.
- There is no PIN, database secret, or local config-override file to manage anymore — `dev.html`'s "backdoor" is gone. Admin access is exactly as strong as the admin account's Firebase Auth password (use a real one, and consider enabling 2-step verification on that Google account).

## Kid-facing notes

- The UI is bilingual EN/BM — a "Bahasa Melayu / English" toggle sits on the auth card and the landing header; the choice persists in localStorage and defaults to the browser language.
- "Forgot password?" on the auth view sends a real Firebase reset email (Identity Toolkit `accounts:sendOobCode`), so the Gmail address used must be able to receive mail.
- If `auth.apiKey` is missing or still a placeholder, the app shows a "Studio isn't set up yet" panel instead of the login form and never attempts auth calls.

## Known tradeoffs (read before relying on this for anything sensitive)

- **The 10MB-per-user cap is best-effort, not atomic.** It's a read-then-write check from the client, so two uploads racing at the exact same moment could both slip through. Fine for a handful of family/friends.
- **Images are compressed client-side** (resized + re-encoded as JPEG) to fit under 500KB before upload — the *original* file never leaves the phone at full size.
- **With the gate open, anyone on the internet can register** and use up database space under their own uid. That's the intended "get everyone onboard first" mode — toggle the gate closed (dev.html → Settings) once the family is in; no rules change needed to do so.
