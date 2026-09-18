# Glossary for Frontend Review

This glossary defines both Opentrons hardware/software domain concepts and specific code-quality anchors used during reviews.

## Review Mechanics (Leading Words)

- **Prop Shadowing** — The anti-pattern of manually typing standard HTML attributes (e.g., `onClick`, `className`) into a custom component's props interface instead of extending native element types.
- **Leak** — A failure in component isolation, such as a CSS Module rule bleeding outward, or a presentation component importing global state hooks.
- **Blind Spot** — An interactive or dynamic element that lacks explicit accessibility metadata (`aria-*` attributes, semantic tags, or keyboard navigation).
- **Drift** — Any deviation from established architectural boundaries (e.g., inline styles instead of design tokens, or placing organism logic inside an atom).
- **Unprotected** — Any new or heavily modified business logic, hook, or component that lacks a corresponding test file (`*.test.tsx` or `*.test.ts`) or fails to cover critical path edge cases.
- **Over-baked** — Speculative or over-engineered code that introduces premature complexity, handles unrequested future use-cases, or crams multiple responsibilities into a single component instead of modularizing.
