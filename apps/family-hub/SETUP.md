# Family Hub — Firebase setup

Family Hub uses the same Firebase project as Studio and Agy Kids Terminal (`arh-firebase-db`), isolated under a `familyHub` root. One owner account per household.

## One-time console steps

1. **Authentication → Sign-in method** → enable **Email/Password**.
2. **Realtime Database → Rules** → merge the rules below into your existing rules (add the `"familyHub"` key alongside `"studio"` and `"kids-terminal"`).
3. Generate `family.config.local.js` from infisical (see section below).

## Security model

- The **owner** signs in with a real Firebase Auth email/password.
- The household iPad is a **trusted device**: once the owner signs in, the app stays authenticated.
- **Parent mode** on the device is protected by a **local 4-digit PIN** (salted hash stored in `localStorage`, never in Firebase).
- If the PIN is forgotten, the owner signs out and signs in again with the email/password.
- Children are **profiles**, not accounts. They use the iPad directly without signing in.

## Rules — paste into Realtime Database → Rules

```json
{
  "rules": {
    "familyHub": {
      "households": {
        "$ownerUid": {
          ".read": "auth != null && auth.uid === $ownerUid",
          ".write": "auth != null && auth.uid === $ownerUid",
          "meta": {
            "ownerUid": { ".validate": "newData.val() === auth.uid" },
            "ownerEmail": { ".validate": "newData.val() === auth.token.email" }
          }
        }
      }
    }
  }
}
```

What this enforces: only the household owner can read or write their own household data. Children and guests have no database access — they interact only with the locally rendered data on the trusted device.

## Secrets

- **`auth.apiKey`** — stored in the gitignored `family.config.local.js`, generated from infisical. Firebase web API keys are public-by-design; access is enforced by Realtime Database rules + the owner's password.
- **Owner password** — never stored in this repo. The owner enters it at first launch and when recovering from a forgotten device PIN.
- **Device PIN** — stored only on the device as a salted PBKDF2 hash. It is not backed up to Firebase and cannot be recovered remotely.

## Generate `family.config.local.js` from infisical

Run from the repo root:

```bash
MSYS_NO_PATHCONV=1 infisical export \
  --projectId=90b0e7ef-3f72-4ddb-b888-055e90e13dfa \
  --env=dev --path=/arh-family-lab/family-hub --format=dotenv > /tmp/fh_env

FIREBASE_URL=$(grep '^FIREBASE_URL=' /tmp/fh_env | cut -d= -f2- | sed "s/^['\\\"]//;s/['\\\"]$//")
FIREBASE_ROOT=$(grep '^FIREBASE_ROOT=' /tmp/fh_env | cut -d= -f2- | sed "s/^['\\\"]//;s/['\\\"]$//")
FIREBASE_API_KEY=$(grep '^FIREBASE_API_KEY=' /tmp/fh_env | cut -d= -f2- | sed "s/^['\\\"]//;s/['\\\"]$//")

cat > apps/family-hub/family.config.local.js <<EOF
// Generated from infisical — do not commit. See SETUP.md.
window.FAMILY_HUB_CONFIG_LOCAL = {
  firebase: {
    url: "${FIREBASE_URL}",
    root: "${FIREBASE_ROOT}",
    apiKey: "${FIREBASE_API_KEY}"
  }
};
EOF

rm /tmp/fh_env
```

This file is gitignored. The committed `family.config.js` merges it at runtime.

## Local dev

```
python -m http.server 4173
```

Open `http://localhost:4173/apps/family-hub/`.

## What household data looks like in Firebase

```json
{
  "familyHub": {
    "households": {
      "OWNER_UID": {
        "meta": {
          "name": "Rumah Hilmi",
          "ownerUid": "OWNER_UID",
          "ownerEmail": "arh.homelab@gmail.com",
          "createdAt": 1722930000000
        },
        "members": {
          "m1": { "name": "Noah", "role": "child", "avatar": "👦", "color": "#3B82F6", "order": 0 },
          "m2": { "name": "Hud", "role": "child", "avatar": "🧒", "color": "#10B981", "order": 1 }
        },
        "tasks": {
          "t1": { "memberId": "m1", "title": "Pack school bag", "category": "morning", "priority": "high", "completed": false, "createdAt": 1722930000000, "updatedAt": 1722930000000 }
        },
        "checklists": {
          "c1": {
            "title": "Leaving for School",
            "icon": "🎒",
            "items": {
              "ci1": { "text": "Water bottle", "checked": true }
            }
          }
        },
        "events": {
          "e1": { "title": "School Departure", "time": "7:15 AM", "member": "Noah & Hud", "memberIds": { "m1": true, "m2": true }, "badge": "Morning", "date": "2026-08-06" }
        },
        "config": {
          "activeTheme": "warm",
          "lang": "en",
          "autoLockSeconds": 120
        }
      }
    }
  }
}
```
