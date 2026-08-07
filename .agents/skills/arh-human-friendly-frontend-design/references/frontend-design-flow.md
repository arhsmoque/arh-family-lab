# Frontend Design Flow

Use this operational flow for new frontends, substantial reskins, candidate comparison, approval, implementation, and handoff.

## State model

```text
FD-01 inspect -> FD-02 classify -> FD-03 adapt -> FD-04 resolve
-> FD-05 compile -> FD-06 preview -> FD-07 validate -> FD-08 review
-> FD-09 refine -> FD-10 freeze -> FD-11 implement -> FD-12 compare
-> FD-13 close
```

Record `completed_through`, `current_phase`, candidate IDs, evidence, and blockers so another agent can resume without reconstructing the design rationale.

## FD-01 — Inspect

**Must:** verify the target checkout and current source; inspect governing instructions, current behavior, representative content, brand assets, user-supplied artifacts, and real implementation seams. Distinguish a visual reference from a runtime foundation.

**Must not:** recreate supplied artifacts without inspecting them; trust README claims over source/runtime behavior; change unrelated dirty files.

**Output:** evidence list, surfaces in scope, preserved behavior, design authorities, unknowns, and mutation boundary.

**Gate:** proceed when the product surface and authority are identified. If no product exists, record the intended surfaces and content contract.

## FD-02 — Classify

**Must:** complete the situation scan in the active skill. Separate human capability, environment, task, and expression. Mark unknowns and state consequential assumptions.

**Must not:** infer reading ability, intelligence, disability, device, or preference from age, income, location, or a demographic label.

**Output:** situation scan and the two or three factors most likely to change design decisions.

**Gate:** do not select a direction until the primary goal, principal audience mismatch, desired feeling, and forbidden feeling are known or explicitly assumed.

## FD-03 — Load adapters

**Must:** load all applicable sections of `domain-adapters.md` and any content/confidence guidance triggered by the scan.

**Must not:** allow a domain convention to weaken the universal floor.

**Output:** selected adapters, added states, protected facts/actions, and domain anti-patterns.

**Gate:** every critical task and consequential fact has an adapter rule or is explicitly covered by the universal floor.

## FD-04 — Resolve directions

**Must:** generate no more than three coherent candidates from registered presentation families. Explain intended feeling, strongest fit, and trade-off. Use the same realistic content and tasks for comparison.

**Must not:** call palette swaps separate directions; invent a stereotype; show an unsafe candidate; copy a reference's brand identity or protected artwork.

**Output:** candidate IDs, direction cards, compatible palette/typography/layout/imagery choices, and risks.

**Gate:** each candidate is internally coherent and materially different in composition or expression.

## FD-05 — Compile

**Must:** resolve semantic roles rather than raw decorative values. Separate primitive values from purpose-based tokens and text-bearing colors from decorative accents. Validate each contract with `scripts/compile_design.py`.

**Must not:** use a single `primary` token for every CTA, decoration, status, and text pairing; claim that a valid token file proves a usable interface.

**Output:** resolved contract, CSS variables, DTCG-shaped token file, preview, and scoped validation receipt.

**Gate:** compiler exits successfully and every warning is reviewed.

## FD-06 — Preview

**Must:** render universal and adapter-required states with realistic content at narrow mobile, desktop, 200% text/reflow, keyboard focus, reduced motion, long translation, missing content, and variable-network states.

**Must not:** seek approval from only a hero, palette board, or ideal happy path.

**Output:** comparable screenshots or live previews and a specimen matrix.

**Gate:** the preview covers the smallest set that demonstrates the real product and its failure/recovery behavior.

## FD-07 — Validate

**Must:** combine deterministic checks with keyboard, zoom/reflow, responsive, content, visual, and task-flow review. When risk warrants, include assistive-technology and representative-user evidence.

**Must not:** treat an automated score as accessibility certification or ignore design surfaces outside the tested component.

**Output:** pass/risk/fail by lens, required fixes, evidence, and untested limits.

**Gate:** correct failures before owner comparison. Present risks explicitly.

## FD-08 — Owner review

**Must:** present bounded choices in human terms, recommend one, state trade-offs, and show validation status.

**Must not:** make the owner choose CSS primitives or obscure a recommendation behind many options.

**Output:** selected direction, feedback, or shared rejection cause.

**Gate:** proceed to refinement after selection; return to FD-02 or FD-04 only when feedback reveals a wrong assumption or shared failure.

## FD-09 — Bounded refinement

**Must:** translate feedback into named axes such as warmth, maturity, energy, density, imagery, or rhythm. Preserve safety and accepted decisions. Recompile and rerun affected checks.

**Must not:** silently redesign unrelated surfaces or reopen settled axes.

**Output:** base candidate, requested change, applied changes, preserved locks, and refreshed evidence.

**Gate:** owner feedback is reflected without breaking compatibility or validation.

## FD-10 — Freeze approval

**Must:** record approved direction, approver/date when available, permitted adaptation, reapproval triggers, configuration hash, screenshots, and validation receipt. If the user orders implementation without preview approval, record an explicit waiver and remaining risk.

**Must not:** infer approval from silence or from permission to explore.

**Output:** intent, resolved contract, tokens, previews, receipt, approval status, and reapproval triggers.

**Gate:** approval or waiver is explicit before substantial production implementation.

## FD-11 — Implement

**Must:** map semantic tokens and patterns through canonical project seams; preserve functionality; implement representative states first; make necessary engineering adaptations traceable.

**Must not:** fork a parallel design authority, hard-code theme values throughout components, or silently change identity.

**Output:** working frontend, tests, and deviation log.

**Gate:** required tasks work on target viewports and input methods.

## FD-12 — Compare fidelity

**Must:** render the implemented app and compare typography, line wrapping, spacing, hierarchy, color roles, imagery, form states, focus, responsive composition, and content density with the approved preview.

**Classify:** `expected_adaptation`, `implementation_defect`, or `design_change`. Fix defects. Seek approval for design changes.

**Output:** comparison evidence and resolved deviations.

**Gate:** no unapproved material design change remains.

## FD-13 — Close

**Must:** verify function, accessibility, responsive behavior, content clarity, performance/resilience proportionately, implementation fidelity, and continuation/rollback evidence.

**Output:** final design result, validation commands/results, known limits, and operator handoff.

**Gate:** every applicable completion item is true and the evidence is current.

## Compressed routes

- **Precise supplied design:** FD-01, FD-02, FD-03, FD-05, FD-06 for missing states, FD-07, FD-10, FD-11, FD-12, FD-13.
- **Minor component repair:** FD-01, FD-02, FD-03, FD-05, FD-07, FD-12, FD-13.
- **Accelerated build:** compress candidate count and review time, not classification, safety, realistic states, or approval/waiver evidence.
- **Existing mature design system:** preserve valid tokens/components; preview a bounded evolution; do not replace it merely because the skill activated.

