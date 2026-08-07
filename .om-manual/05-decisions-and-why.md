# 5. arh-family-lab — decisions and why

_Decision and design records found in the project, quoted from the source documents. Generated directly from project records._

## Taman Ilmu — frontend direction

Source: `apps/kids-grades-garden/DESIGN.md` (opening section, quoted verbatim):

> # Taman Ilmu — frontend direction
>
> ## Product posture
>
> - Audience: three school-age siblings and their parent/caregiver.
> - Job: keep a private, child-owned record of everyday learning, not only marks.
> - Dominant environment: touch-first phones, intermittent use between school routines.
> - Primary action: select a child and add a story, photo, or result in under a minute.
> - Failure cost: exposing children's data, losing a post, or making one child feel compared with another.
> - Archetype: private social scrapbook with a lightweight learning record.
> - Signature behavior: the profile header always shows the child's two-part day — SJKC morning and KAFA evening — as one continuous journey.
>
> ## Visual language
>
> The Stitch Bright Futures concept contributes tactile depth, rounded shapes, warm paper and a visible dual-school switch. Taman Ilmu deliberately removes public rankings, locked rewards, competitive badges, perpetual motion and bright primary-color overload. The family-lab warm cream, deep green and restrained leaf/sun/berry accents keep the app calm enough for daily use.
>
> The interface uses large touch targets, a four-item mobile dock, horizontal child switching and a responsive desktop rail. Cards only contain distinct writable or record-like objects. Empty, loading, saving, error, offline and permission states are explicit.
>
> ## Privacy choices
>
> There is no public profile or share link. Authentication is restricted in Firebase Rules to `arh.homelab@gmail.com`. Every record lives under that authenticated user's UID. Photos are resized and recompressed before being written as data URLs inside the protected Realtime Database subtree; this keeps the first release aligned with the proven Studio REST architecture and avoids bearer-like public image download URLs.

## CPR Scenario Lab v1 — Interaction Specification

Source: `clinical/cpr-scenario-lab-v1/DESIGN.md` (opening section, quoted verbatim):

> # CPR Scenario Lab v1 — Interaction Specification
>
> ## Purpose
>
> Turn passive CPR recall into a facilitator-led rehearsal where four learners each own one meaningful action. The prop supports teaching and discussion; it does not assess CPR competence or replace manikin practice.
>
> ## Cognitive requirements
>
> - Present one decision at a time; never expose the whole algorithm while a novice is choosing.
> - Keep the active rehearsal model to four named missions: `Kenal pasti`, `Aktifkan bantuan`, `Tekan dada`, `Gunakan AED`.
> - A wrong decision must prompt a retry; it must never unlock the next mission.
> - Reveal the full route only during debrief, after learners have traversed it.
> - Reserve colour semantics: red = emergency activation, coral = compressions, cyan = AED/information, green = correct/recovery, amber = caution.
> - Use motion only for the compression pulse and current-step transition; respect reduced-motion preferences.
>
> ## Physical role cards
>
> | Role | Symbol | Responsibility |
> |---|---|---|
> | Safety Coach | Shield | Identify danger and verify safe approach |
> | Caller | Phone | Call 999, use speaker mode, give location |
> | Compressor | Hands | Start and maintain 100–120/min compressions |
> | AED Runner | Bolt | Retrieve, power, place pads, call clear |
>
> Cards can be handwritten or printed. The projector uses the same symbols and names.
>
> ## State machine
>
> ```text
> lobby
>   -> roles
>   -> decision-recognition
>   -> decision-activation
>   -> compression-practice
>   -> aed-placement
>   -> debrief
>   -> lobby (reset)
> ```
>
> The facilitator owns all transitions. No screen auto-advances.

## Standing guidance (AGENTS.md)

Source: `apps/kids-grades-garden/AGENTS.md` (opening, quoted verbatim):

> # AGENTS.md
>
> ## Contract
>
> - Product: private, mobile-first family learning scrapbook for three children.
> - Stack: static HTML/CSS/ES modules; no frontend build step.
> - Data: Firebase Authentication + Realtime Database REST under `/kidsGarden/users/{uid}`.
> - Hosting: Cloudflare Workers Static Assets from `public/`.
> - Toolchain: Node from `.node-version`, pnpm from `packageManager`.
>
> ## Safety boundaries
>
> - Never add database secrets, service-account files, OAuth tokens or child-identifying production fixtures.
> - Preserve deny-by-default RTDB rules and the owner-email plus UID boundary.
> - Run emulator rules tests before any production rules deploy.
> - Do not make profiles or photo URLs public.
> - Keep the three children peer-level; do not add rankings or sibling comparison features.
>
> ## Verification
>
> ```powershell
> pnpm install --frozen-lockfile
> pnpm test
> pnpm test:rules
> pnpm deploy:dry
> ```

