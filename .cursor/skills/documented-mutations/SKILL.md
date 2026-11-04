---
name: documented-mutations
description: >-
  Migrate react-api-client useMutation hooks to useDocumentedMutation and update
  app callsites, tests, api-client userNotes, and audit_log keys. Use when
  converting mutations to documented mutations, wiring documentationState, or
  adding audit log actions for access control.
---

# Documented Mutations

Migrate a `useMutation` hook to `useDocumentedMutation`. Copy shape from a migrated example (e.g. `react-api-client/src/runs/usePlayRunMutation.ts`).

## Before coding

**Prompt the user for an audit log key and text.** Do not invent either. Then add:

1. Key to `AuditLogAction` in `react-api-client/src/accessControl/types.ts`
2. `"key": "text"` in `app/src/assets/localization/en/audit_log.json` only (never `zh/`)

## Hook (`react-api-client`)

1. Replace `useMutation` with `useDocumentedMutation` from `../accessControl`.
2. Require `documentationState: DocumentationState` as the first arg.
3. Pass `actionsToDocument` as `['audit_log_key']`.
4. Mutation fn must take `{ variables, userNotes }` (`DocumentedMutationParameters`) and forward `userNotes` to the api-client call.
5. Ensure the api-client function accepts/sends `userNotes` if it does not already.

## Callsites (`app/`)

- Flex / shared / ODD: pass `useDocumentationState()` (or an existing docs state).
- **OT-2 only callsites do not need to be updated and should be passed** `ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE` from `app/src/local-resources/access-control/utils.ts`.
- **Docs modal cancel:** on isDocumentedMutationError, stay on the screen that launched the mutation (confirm modal, wizard step, etc.). Reset any in-flight UI; do not toast, navigate away, or apply mutation success side effects.

## Tests — update with proper mocks

- Hook tests: pass `ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE` from `react-api-client/src/accessControl/__fixtures__/documentationState`.
- App tests: mock `useDocumentationState` (or pass the fixture) using `ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE` from `app/src/local-resources/access-control/__fixtures__/documentationState`.
- Keep api-client / `useHost` mocks; assert `userNotes` is forwarded when relevant.
- Do not add any new test files.

## Checklist

- [ ] User supplied audit log key + English text
- [ ] `AuditLogAction` + `en/audit_log.json` updated
- [ ] Hook uses `useDocumentedMutation` + `userNotes`
- [ ] api-client accepts `userNotes`
- [ ] Non-OT2 callsites get real docs state; OT2-only get disabled constant
- [ ] Docs cancel restores prior screen with no changes / no user-facing error
- [ ] Hook + app tests updated with proper mocks/fixtures
