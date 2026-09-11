---
name: grill-frontend-code
description: Deep-dive review of frontend diffs against Opentrons architecture, UI layers, a11y, and prop design patterns.
disable-model-invocation: true
---

A code review exists to arrest regression and enforce architectural rigor. You do not just "look over" code; you relentlessly hunt for divergence from Opentrons standards.

## Execution Steps

1. **Gather context** — Execute the following commands to capture the diff and untracked file status:

```shell
git diff
git diff --cached
git status --short
```

If untracked files exist in frontend paths, read their entire contents immediately (**legwork**).

2. **Static & Dynamic Verification** — Run diagnostics and test suites to catch structural and runtime failures before deep-dive review:

```shell
npx -y react-doctor@latest . --verbose
```

_(Optional)_ Run the relevant Vitest test suite for the modified files to ensure existing logic is unimpaired. Incorporate any discovered linter errors or test failures directly into your final output findings.

3. **Evaluate against Reference** — Open `review-reference.md` and `GLOSSARY.md` via their context pointers. Evaluate every modified or added line, specifically auditing for:

- **Prop Shadowing** in new component interfaces.
- **Leak** across Atomic Design layers or style boundaries.
- **Blind Spot** occurrences in interactive or dynamic elements.
- **Drift** from core Opentrons patterns or design tokens.
- **Unprotected** components or logic that lack proper sibling tests or edge-case coverage.
- **Over-baked** components that choose speculative over-engineering over tight, modular separation.

## Output Format

Report _only_ when definitive issues are found. If the diff perfectly matches all patterns, output exactly: `No issues`.

For each issue found, map it to a glossary anchor and maintain this strict structural block:

```
[Severity: high/medium/low] file-path:line-number (<Anchor_Name>)
Details: <Clear explanation of the issue using glossary definitions>
Suggestion: <Proposed exact code fix or structural refactor>

```

## Completion Criterion

- **Exhaustive Tracking**: Every added or modified component, CSS module rule, and exported entity has been explicitly cross-referenced with `review-reference.md`.
- **Zero Halos**: No vague or conversational suggestions (e.g., "Consider fixing this"). Every comment must have an explicit `Suggestion` block containing executable code or exact structural directives.
- **Glossary Alignment**: Every reported issue is explicitly classified under one of the leading words defined in `GLOSSARY.md`.
