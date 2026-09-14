# Implementing Documented Mutation Hooks

To maintain Compliance Ready Software, all mutations (POST, PUT, PATCH requests to the robot server) must go through `useDocumentedMutation` instead of calling `useMutation` directly. This wrapper prompts for login and user documentation when Compliance Ready Software mode is enabled, and forwards `userNotes` to the robot API.

This guide walks through adding a **new** documented mutation end to end. You can use an existing hook such as [`usePlayRunMutation`](../../../react-api-client/src/runs/usePlayRunMutation.ts) as a template.

Direct `useMutation` calls are blocked by the `opentrons/no-direct-use-mutation` ESLint rule. Exceptions are rare, and only for endpoints where authorization and documentation are not required. If you think your feature is an exception, check in with Janie, Seth, or Nick Ritso before proceeding.

## Why do we need to do this?

Maintaining Compliance Ready Software means that every action taken on a robot needs to be tracked and added to an auditable list. This list needs to include what action was taken, who took the action, and why they took the action. `useDocumentedMutation` handles collecting the 'who' and 'why' and passes that information to the backend to be stored in the audit log.

## Glossary

- [`DocumentationState`](../../../react-api-client/src/accessControl/types.ts): An object that holds all the information needed to run a documented mutation, i.e. if access control is enabled, if user documentation is required, a documentation report if one has been provided in advance, and callbacks to pop up the login modal or the documentation required modal as needed. As `react-api-client` functions cannot generate UI, these must be generated at callsites in `/app` and passed into the `useTKTKMutation` hooks separately.

## Overview

You will typically touch:

1. **Audit log key + copy** — add copy for the 'Documentation Required' modal to list under 'Actions to Document'
2. **`api-client`** — accept and send `userNotes` on the HTTP request
3. **`react-api-client` hook** — wrap the api-client function call with `useDocumentedMutation`
4. **`app/` callsites** — generate and pass documentation state into the hook, handle documentation modal cancel
5. **Existing tests** — pass disabled documentation fixtures / mocks

## 1. Choose an audit log key and English text

You need a stable snake_case key and a short English phrase capitalized and in gerund form for the Documentation Required modal (e.g. `play_run` → `"Playing protocol"`). These should clearly describe the action being taken to the end user.

Add these here:

1. The key to the `AuditLogAction` union in [`react-api-client/src/accessControl/types.ts`](../../../react-api-client/src/accessControl/types.ts)
2. Matching `"key": "text"` in [`app/src/assets/localization/en/audit_log.json`](../../../app/src/assets/localization/en/audit_log.json)

The key in `AuditLogAction`, the string you pass in `actionsToDocument`, and the `audit_log.json` entry must all match.

If you need to pass more information than a simple string, look at the other types in the DocumentedAction union. These encode commands, wizard flow steps, etc. as actions readable by the modal. See [Action List](../../../app/src/organisms/ActionItems/ActionList.tsx) for more information.

## 2. Pass userNotes through the api-client function

The mutation function must accept `userNotes` and pass it into the call to `request` as part of the request config object.

Example shape:

```ts
export function createThing(
  config: HostConfig,
  data: CreateThingData,
  userNotes?: string
): ResponsePromise<Thing> {
  return request<Thing, { data: CreateThingData }>(POST, '/things', config, {
    body: { data },
    userNotes,
  })
}
```

Request will take userNotes and pass it to the backend as part of a special header.

If the function already exists without `userNotes`, add the parameter and thread it through the same way other documented endpoints do (see `createRunAction`, `deleteRun`, etc.).

## 3. Write the react-api-client hook

`useDocumentedMutation` calls can take the same form as 'useMutation' calls, but with some adjustments to their shape.

You must take in and pass through a 'DocumentationState' object that will be generated in /app callsites. You must also pass in a list of 'actions to document'. In most cases this will be an array with a single entry - the action you defined in step 1.

You can then pass in mutation keys and a mutation function as you would with `useMutation`. The mutation function must take have its parameters in the form `({ variables: TVariables, userNotes: string })`, and pass userNotes to the api-client function as you defined in step 2.

### Required shape

| Piece            | Requirement                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| First argument   | `documentationState: DocumentationState`                                                              |
| Second Argument  | Pass `actionsToDocument` as `['your_audit_log_key']` (or merge with an optional caller-supplied list) |
| Mutation fn args | Destructure `{ variables, userNotes }` (`DocumentedMutationParameters`)                               |
| api-client call  | Forward `userNotes` into the api-client function                                                      |

### Example

```ts
import { createThing } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export const useCreateThingMutation = (
  documentationState: DocumentationState,
  options = {}
) => {
  const host = useHost()
  const mutation = useDocumentedMutation(
    documentationState,
    ['create_thing'], // must match AuditLogAction + audit_log.json
    getQueryKey(host, 'things', 'create'),
    ({
      variables: data,
      userNotes,
    }: DocumentedMutationParameters<CreateThingData>) =>
      createThing(host!, data, userNotes).then(response => response.data),
    options
  )

  return {
    ...mutation,
    createThing: mutation.mutate,
  }
}
```

`useDocumentedMutation` mirrors the `useMutation` call shapes used in this repo: with or without a mutation key, plus options last.

## 4. Wire app callsites

### Documentation state

In the app, we must generate a `DocumentationState` to pass into our new mutation hook. There are a few ways to do this:

1. `useDocumentationState` - the most common case. Default to using this. The behavior is very simple - each mutation passed in the `DocumentationState `this generates will prompt for documentation when the mutation runs. The userNote this prompting generates is not stored, and just passed to the mutation directly.
2. `useLinkedDocumentationState` - use this when two mutations run back to back and prompting for both would be disruptive to the user experience. For instance, sending a protocol to a robot and immediately running it. The first mutation will prompt for documentation, and the collected userNote will be stored and given to any other mutations passed the `DocumentationState`
3. `useMaintenanceRunDocumentation` - use this for new maintenance runs. Pass the `commandDocState` into the `useCreateTargetedMaintenanceRunMutation` and `useChainMaintenanceCommands` calls, and `deletionDocState` into `useDeleteMaintenanceRunMutation`. This will prompt for documentation once at the beginning, track all the commands sent to the robot during the maintenance run, and prompt again listing all the actions at the end.
4. `usePromptForDocumentation` - use this to synchronously prompt for documentation, capture the userNote, and pass it to a mutation. Its for when you need to prompt at a very specific time before a mutation runs. See [ChoosePipette](../../../app/src/organisms/PipetteWizardFlows/ChoosePipette.tsx) for an example.

### Docs modal cancel

When the user dismisses the documentation (or login) modal, `useDocumentedMutation` rejects with a `DocumentedMutationError`. Detect it with `isDocumentedMutationError` from `@opentrons/react-api-client`.

On that error:

- Stay on the screen that launched the mutation (confirm modal, wizard step, etc.)
- Reset any in-flight UI (loading flags, disabled buttons)
- Do **not** toast, navigate away, or run success side effects

```ts
onError: error => {
  if (isDocumentedMutationError(error)) {
    setIsSubmitting(false)
    return
  }
  // real request failures…
}
```

## 5. Update tests

To test the new hook directly you can pass in `ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE`.

Tests for functions that call `useDocumentationState` will fail without it being mocked like so:

```ts
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
```

## Checklist

- [ ] `AuditLogAction` and `en/audit_log.json` updated with new key
- [ ] api-client accepts and sends `userNotes`
- [ ] Hook uses `useDocumentedMutation` with `documentationState`, `actionsToDocument`, and correctly formed `DocumentedMutationFunction`
- [ ] All callsites pass in generated `DocumentationState`
- [ ] Docs / login cancel restores prior UI with no success side effects and no user-facing error toast
- [ ] Existing hook and app tests updated with the disabled documentation fixture / mocks

## Reference files

- Wrapper: `react-api-client/src/accessControl/useDocumentedMutation.ts`
- Types: `react-api-client/src/accessControl/types.ts`
- Example hooks: `react-api-client/src/runs/usePlayRunMutation.ts`, `react-api-client/src/auth/users/useCreateUserMutation.ts`
- App docs state: `app/src/local-resources/access-control/useDocumentationState.ts`
- Disabled constant (runtime): `app/src/local-resources/access-control/utils.ts`
- Cancel handling example: `app/src/organisms/EmergencyStop/EstopPressedModal.tsx`
