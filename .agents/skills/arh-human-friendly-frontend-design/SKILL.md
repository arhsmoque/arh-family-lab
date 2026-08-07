---
name: arh-human-friendly-frontend-design
description: "Use when designing, reskinning, reviewing, or approving frontends for everyday audiences, mixed literacy, low digital confidence, families, older adults, community services, education, wellbeing, lifestyle products, or local commerce; also use for requests such as warm, approachable, non-corporate, easy to read, family-friendly but not childish, premium without luxury, or modern without feeling clinical."
compatibility: "Framework-neutral. Requires file read access for review; preview compilation requires Python 3.10 or newer and uses only the standard library."
---

# Arh Human Friendly Frontend Design

# Human-Friendly Frontend Design

Design for dignity, comprehension, confidence, and ordinary life. Treat visual taste as a bounded system, not a sequence of CSS guesses.

Never equate low digital confidence with low intelligence, family-friendly with childish, lifestyle with decorative, premium with luxury, simple with incomplete, or non-corporate with inconsistent.

## Mandatory sequence

Follow the applicable phases in order. Violating the sequence violates the design gate.

1. **FD-01 Inspect.** Read the product brief, governing instructions, current frontend, functional constraints, real content, supplied artifacts, and visual references. Preserve working behavior. For an existing app, identify the actual composition seam through which design changes ship.
2. **FD-02 Classify.** Complete the situation scan below before selecting colors, fonts, layout, or components. Infer only from evidence; mark unknowns. Ask only questions whose answers would materially change the direction.
3. **FD-03 Adapt.** Load every applicable domain and audience adapter from [domain-adapters.md](references/domain-adapters.md). Adapters add constraints; they never weaken the universal floor.
4. **FD-04 Resolve.** Translate subjective language into one to three coherent presentation directions. Use registered compatible choices from [presentation-families.md](references/presentation-families.md). Make candidates compositionally distinct, not palette swaps.
5. **FD-05 Compile.** Resolve semantic design tokens, typography roles, spacing, shape, imagery, content, and motion. Keep owner-facing intent separate from platform safety. Use `assets/design-contract.schema.json` as the editor/interchange contract and run `scripts/compile_design.py` for authoritative runtime validation and artifact generation.
6. **FD-06 Preview.** Render realistic content and every required state below at narrow mobile, desktop, enlarged-text/reflow, keyboard-focus, and reduced-motion conditions.
7. **FD-07 Validate.** Run deterministic checks and the visual checklist. Correct unsafe candidates before presenting them; never ask the owner to choose between safe and unsafe options.
8. **FD-08 Review.** Present no more than three bounded choices with the intended feeling, strongest fit, trade-off, and validation status. Recommend one.
9. **FD-09 Refine.** Translate feedback into bounded axes. Preserve approved safety and functional decisions. Do not restart from arbitrary styling unless every candidate was rejected for a shared root cause.
10. **FD-10 Freeze.** Record explicit approval or an explicit waiver using `assets/approval-template.json` or an equivalent project record. Export the intent, resolved contract, tokens, previews, validation receipt, and changes that require reapproval.
11. **FD-11 Implement.** Build from the frozen contract through the project's canonical component and token seams. Do not silently introduce a new visual identity.
12. **FD-12 Compare.** Compare the real implementation with approved previews. Classify differences as expected adaptation, implementation defect, or design change. Fix defects; seek approval for design changes.
13. **FD-13 Close.** Verify accessibility, content clarity, responsive behavior, functionality, fidelity, and rollback/continuation evidence.

For a new frontend, substantial reskin, or unresolved visual direction, read [frontend-design-flow.md](references/frontend-design-flow.md) completely before FD-02. For a small component repair, apply FD-01, FD-02, FD-03, FD-05, FD-07, FD-12, and FD-13 proportionately; do not invent unnecessary candidates.

## Situation scan

Record this structure in working state or the design result:

```yaml
situation_scan:
  audience:
    digital_confidence: "low | mixed | high | unknown"
    reading_comfort: "limited | everyday | advanced | mixed | unknown"
    language_familiarity: "primary | second_language | multilingual | mixed | unknown"
    age_mix: "children | adults | older_adults | multigenerational | mixed | unknown"
  context:
    attention: "focused | distracted | hurried | intermittent | unknown"
    device_quality: "older_mobile | common_mobile | modern_mixed | unknown"
    connectivity: "fragile | variable | reliable | unknown"
    assistance: "independent | shared_device | helper_available | mixed | unknown"
  task:
    primary_goal: ""
    consequence: "low | meaningful | high | unknown"
    frequency: "first_time | occasional | repeat | unknown"
    complexity: "single_action | short_flow | multi_step | unknown"
  expression:
    desired_feeling: ""
    must_not_feel: []
    warmth: "cool | balanced | warm | unknown"
    maturity: "approachable | composed | sophisticated | unknown"
    energy: "quiet | steady | lively | unknown"
    formality: "informal | respectful | formal | unknown"
```

Do not treat a demographic label as a capability diagnosis. Design for observed mismatches among people, task, device, content, and environment.

## Owner and platform boundary

Let the owner choose meaning and expression:

```yaml
owner_controls:
  - desired_feeling
  - must_not_feel
  - presentation_family
  - warmth
  - maturity
  - energy
  - density
  - imagery_character
  - layout_rhythm
```

Make the platform resolve safety and coherence:

```yaml
platform_resolves:
  - semantic_color_pairs
  - typography_roles
  - spacing_scale
  - component_states
  - focus_treatment
  - touch_targets
  - responsive_behavior
  - motion_safety
  - error_recovery
  - compatibility_rules
```

Expose raw colors or CSS only as an advanced editing surface. Do not let owner controls disable comprehension, focus, recovery, or critical actions.

## Universal floor

Apply all applicable rules:

- Meet WCAG 2.2 AA; treat automated checks as partial evidence, not certification.
- Keep meaningful normal text at or above `4.5:1`, large text and essential graphical boundaries at or above `3:1`, and visible focus against adjacent surfaces.
- Never use color, position, shape, sound, or motion as the only carrier of meaning.
- Use explicit labels for unfamiliar icons and actions. Keep navigation, help, system status, and recovery predictable.
- Support keyboard operation, text resizing, reflow, device orientation, reduced motion, and touch without precision gestures.
- Use a minimum target floor of 24 CSS px and prefer 44 CSS px or larger for primary actions serving mixed-confidence or mobile audiences.
- Use familiar words, short direct sentences, literal language, descriptive headings, small content blocks, and one instruction per step. Explain unusual terms and numerical concepts.
- Put essential facts in text, not only images, video, hover, tooltips, placeholders, or animation.
- Keep forms single-purpose where practical. Show persistent labels, requirements before entry, inline error identification, a recovery action, and confirmation for consequential submission.
- Preserve useful work across errors and intermittent connectivity. Design loading, offline, timeout, empty, missing-media, permission, and partial-data states.
- Make mobile a first-class composition. Do not compress desktop, hide core actions, or force horizontal reading.
- Respect older devices and variable networks: avoid dependency-heavy decoration, uncontrolled media, layout shifts, and motion that blocks completion.
- Treat culture as researched content and provenance, not generic motifs, flags, costumes, or an `ethnic` palette.

Never reinterpret soft as faint, friendly as childish, premium as illegible, minimal as hidden, modern as corporate, lifestyle as vague, accessible as visually bland, or simple as fewer necessary facts.

## Required preview states

Preview the smallest representative set that proves the real product, including:

```text
first screen; navigation; information list; detail; primary action; form;
success; validation error; empty; missing media; loading; offline or failure;
help/contact; narrow mobile; desktop; enlarged text/reflow; keyboard focus;
reduced motion; realistic long or translated content.
```

Add the states required by the selected domain adapter. Use identical realistic content when comparing candidates.

## Validation gate

Run `scripts/compile_design.py <contract.json> --out <preview-dir>` when a resolved contract exists. Read its receipt. A successful receipt proves only schema shape, required states, selected token-pair contrast, safety locks, and artifact generation.

Apply this compact gate before approval or completion:

```yaml
completion_gate:
  evidence_inspected: false
  situation_classified: false
  required_adapters_loaded: false
  direction_explained: false
  forbidden_traits_checked: false
  realistic_states_previewed: false
  deterministic_validation_passed: false
  content_clarity_reviewed: false
  responsive_and_input_reviewed: false
  owner_approval_or_waiver_recorded: false
  implementation_contract_exported: false
  implementation_fidelity_checked: false
```

Do not call the design ready while any applicable gate is false, failed, or unverified. Do not use a polished hero, green tests, or a valid token file as a substitute for inspecting the whole relevant surface.

## Routing

- Read [frontend-design-flow.md](references/frontend-design-flow.md) for new builds, substantial reskins, candidate comparison, approval, implementation, or handoff.
- Read [domain-adapters.md](references/domain-adapters.md) for family, education, food/local commerce, community services, wellbeing, household, or local professional services.
- Read [presentation-families.md](references/presentation-families.md) before resolving a named direction or starter pack.
- Read [content-and-confidence.md](references/content-and-confidence.md) when reading comfort, language familiarity, digital confidence, error recovery, or consequential forms matter.
- Read [reference-analysis.md](references/reference-analysis.md) whenever the user supplies visual references, screenshots, existing designs, or phrases such as `like this`.
- Read [research-foundations.md](references/research-foundations.md) when changing the universal floor or defending a rule.

## Output contract

Report or persist:

```yaml
design_result:
  interpreted_request: ""
  situation_scan: {}
  selected_adapters: []
  candidate_directions: []
  selected_direction: ""
  resolved_tokens: ""
  resolved_typography: ""
  resolved_layout: ""
  resolved_imagery: ""
  resolved_motion: ""
  previewed_states: []
  safety_locks_applied: []
  validation_evidence: []
  anti_patterns_avoided: []
  remaining_risks: []
  approval_status: "draft | candidate | approved | waived"
  implementation_artifacts: []
  reapproval_triggers: []
```
