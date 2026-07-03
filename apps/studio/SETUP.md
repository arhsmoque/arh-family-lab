# Studio — Firebase setup

Studio reuses the same Firebase project as the homestay app (`arh-firebase-db`), in an isolated `studio` path. Nothing here touches homestay data.

## One-time console steps (console.firebase.google.com)

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Project settings → General** → copy the **Web API Key** → paste into `studio.config.js` as `auth.apiKey`.
3. **Project settings → Service accounts → Database secrets** (sometimes shown as "legacy secrets") → generate/copy a secret → paste into `studio.config.js` as `dev.dbSecret`. This key grants full read/write to the *entire* database, bypassing all rules — it's only ever used from `dev.html`, never from the public app.
4. Pick a PIN for `dev.pin` in `studio.config.js` (this gates `dev.html`, same pattern as `admin.html`'s owner/developer PIN).
5. **Realtime Database → Rules** → merge the block below into your existing rules (add the `"studio"` key alongside whatever's already there for the homestay app — don't replace the whole tree):

```json
{
  "rules": {
    "studio": {
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

What this enforces: a signed-in user can only ever read/write their **own** `studio/users/{their uid}` subtree, and only if their token's email is present in `studio/allowlist`. Nobody — not even a signed-in user — can read or write the allowlist itself (except their own single entry, to check they're approved); only the dev-console secret can add/remove entries. A profile's `email` field can't be spoofed to someone else's address. Photo cards are capped at ~700KB of base64 (≈500KB image) at the database-rule level, not just client-side.

6. Approve your own email first via `dev.html` (Approved emails tab) before trying to sign up in the real app — sign-up on an unapproved email is allowed by Firebase Auth itself but Studio immediately signs it back out since it has no data access.

## Known tradeoffs (read before relying on this for anything sensitive)

- **`dev.html` is a real backdoor.** Its dbSecret bypasses every rule above. Anyone who loads that page and knows the PIN has full read/write to all users' data. Don't link it from the public app, don't share the URL, consider renaming the file to something unguessable when you deploy, and treat the PIN like a real password.
- **The 10MB-per-user cap is best-effort, not atomic.** It's a read-then-write check from the client, so two uploads racing at the exact same moment could both slip through. Fine for a handful of family/friends; not something to rely on if this ever gets more users than you can build with the DB secret + a click.
- **Images are compressed client-side** (resized + re-encoded as JPEG) to fit under 500KB before upload — the *original* file never leaves the phone at full size.
