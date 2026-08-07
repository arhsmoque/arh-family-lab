# Research Foundations

Use these sources when changing or defending the universal floor. Verify the current source before changing normative claims.

## Normative accessibility gate

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — current W3C Recommendation and AA conformance authority.
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) — success criteria and techniques.
- [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) — focus, dragging, target size, help, redundant entry, and accessible authentication additions.

Use WCAG 2.2 AA as the normative floor. Treat AAA focus appearance and 44 CSS px targets as preferred enhanced defaults, not AA claims. Do not use APCA or WCAG 3 as the sole current conformance gate.

## Supplemental cognitive and inclusive guidance

- [WAI cognitive accessibility](https://www.w3.org/WAI/cognitive/)
- [WAI clear and understandable content](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/)
- [WAI supplemental cognitive guidance](https://www.w3.org/WAI/WCAG2/supplemental/)
- [Microsoft Inclusive Design](https://inclusive.microsoft.design/)
- [GDS: Making your service more inclusive](https://www.gov.uk/service-manual/design/making-your-service-more-inclusive)
- [GDS: Assisted digital](https://www.gov.uk/service-manual/assisted-digital/)

Treat COGA and inclusive-design guidance as a quality layer above WCAG, not additional normative conformance.

## Resilience and implementation

- [GDS progressive enhancement](https://www.gov.uk/service-manual/technology/using-progressive-enhancement)
- [GDS browsers and devices](https://www.gov.uk/service-manual/technology/designing-for-different-browsers-and-devices)
- [WAI ARIA Authoring Practices: Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [web.dev responsive images](https://web.dev/articles/serve-responsive-images)
- [web.dev Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds)

Prefer native semantic HTML and progressive enhancement for essential journeys. Treat performance as inclusion and Core Web Vitals as diagnostics, not accessibility certification.

## Design-token interoperability

- [Design Tokens Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)

The 2025.10 format is a stable Community Group specification for vendor-neutral token interchange. It is not a W3C Recommendation. Use typed tokens, semantic groups, descriptions, and aliases where supported; preserve a simpler resolved contract as the human review authority.

## Evidence levels

Report evidence distinctly:

```text
normative: WCAG success criteria and conformance evidence
supplemental: cognitive/inclusive quality review
engineering: resilience and performance diagnostics
contextual: representative research and domain review
interoperability: token-format validation
```

Automated validation never proves complete accessibility. Combine automated, manual, assistive-technology, and representative-user testing proportionately to risk.
