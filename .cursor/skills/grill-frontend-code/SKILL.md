---
name: grill-frontend-code
description: Review frontend code changes for component quality, test coverage, bugs, maintainability, and consistency with project patterns.
---

## Review target

Obtain the diff of the changes with the following commands and review them:

```shell
git diff
git diff --cached
```

If there are new untracked files, read the file contents directly and review them.

```shell
git status --short
```

## Review perspectives

1. **New component** - New components are written using CSS Modules and include tests
2. **Bugs and logic errors** — Unintended behavior, overlooked edge cases, off‑by‑one errors, optional undefined cases
3. **Readability and maintainability** — Unclear naming, unnecessary complexity, excessive abstraction, nested ternary
4. **Consistency** — Alignment with existing codebase styles and patterns

## Points to confirm

see [reference-check-list.md](reference-check-list.md).

## Output format

Only report when there are issues. If there are no issues, report “No issues”.
Keep each comment concise and use the following structure:

```
format:[Severity: high/medium/low] file-path:line-number
Details: Explanation of the issue
Suggestion: Proposed fix
```

Post‑review feedback:
If this review misses any mistakes or reveals new pitfalls, add them to `reference-check-list.md`
