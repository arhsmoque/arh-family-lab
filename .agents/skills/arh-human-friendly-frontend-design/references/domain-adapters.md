# Domain Adapters

Load every applicable adapter. Combine adapters by taking the union of protected facts, states, and anti-patterns. Resolve conflicts in favor of comprehension, safety, and the user's explicit product intent.

## Family and multigenerational

Protect child dignity, adult respect, shared-device privacy, role clarity, large readable targets, calm hierarchy, and non-patronizing language. Add child/parent role states, shared-device sign-out/privacy, long names, missing profile image, and handoff between family members.

Avoid mascots by default, rainbow navigation, bubble UI, infantilizing copy, color-coded children without text, covert surveillance cues, and presenting parent-controlled academics as child ranking or competition.

## Education and learning

Protect learning objective, level/age suitability, progress meaning, instructions, feedback, schedule, ownership of assessment, and a clear return path. Add lesson/task states, incomplete work, feedback, no-content, submission error, and saved draft.

Avoid decoration before hierarchy, unexplained scores, punitive error language, gamification that obscures learning, and assuming one learner context from age alone.

## Food and local commerce

Protect item identity, price, variants, availability, fulfilment, contact/order path, cart state, and confirmation. Add missing image, sold out, closed, variant, item detail, sticky cart, failed order/contact, and recovery states.

Avoid fake black-and-gold premium styling, tiny luxury text, appetite-damaging overlays, baked-in menu facts, autoplay grids, animated prices, hidden carts, and owner controls that weaken checkout reliability.

## Community and public-facing services

Protect service purpose, eligibility, cost, location, hours, documents needed, next action, status, help, and assisted/offline routes. Add eligibility, unavailable service, appointment/form error, confirmation, alternative channel, and interrupted journey states.

Avoid institutional jargon, unexplained acronyms, dashboard-first presentation, ambiguous eligibility, hidden contact information, and digital-only assumptions.

## Wellbeing and support

Protect emotional safety, scope, privacy, crisis/escalation routes where applicable, progress meaning, and non-judgmental recovery. Add private/shared-device state, interrupted activity, opt-out, help, and urgent-support signposting when in scope.

Avoid clinical claims without authority, forced positivity, guilt-based streaks, intense motion, diagnostic color coding, and making a calm appearance more important than clear help.

## Household and family utilities

Protect ownership, who can see/change what, status freshness, consequential action confirmation, undo, reminders, and shared responsibility. Add stale data, offline, permission denied, partial sync, destructive confirmation, and handoff states.

Avoid silent automation, ambiguous ownership, hidden timestamps, irreversible one-tap actions, and notification overload.

## Local professional and lifestyle services

Protect service scope, price or quotation expectations, practitioner identity, trust evidence, availability, booking/contact path, cancellation, and privacy. Add no availability, booking error, confirmation, cancellation, missing media, and alternate contact states.

Avoid generic corporate dashboards, stock-photo-only trust, vague lifestyle prose replacing service facts, luxury cues that reduce readability, and social proof without provenance.

## Mixed or new domain

Write a temporary adapter in the design result with:

```yaml
adapter:
  protected_facts: []
  protected_actions: []
  required_states: []
  trust_and_safety: []
  anti_patterns: []
```

Propose a reusable adapter only after the same rule recurs across multiple products.

