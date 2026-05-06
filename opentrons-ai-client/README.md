# Opentrons AI Frontend

## Overview

OpentronsAI is a web application that generates and updates Opentrons Python protocols from natural language descriptions. It communicates with the [opentrons-ai-server][] backend over a JSON HTTP API.

## Developing

To get started:

1. Clone the `Opentrons/opentrons` repository
1. Read the [contributing guide.][contributing-guide-setup]
1. Follow the [DEV_SETUP.md](../DEV_SETUP.md) for your platform.

```shell
# from the repo root

# install all dependencies
make setup

# if dependencies are already installed
make teardown-js && make setup-js

# start the dev server
make -C opentrons-ai-client dev
```

## Auth0

[Auth0 requires consent](https://auth0.com/docs/get-started/applications/confidential-and-public-applications/user-consent-and-third-party-applications#skip-consent-for-first-party-applications) in the local application.

### Allow consent in the local application

Alter the `authorizationParams` in `src/main.tsx`, provide consent, then remove the change. Once you provide consent in the local application, you will not be prompted for consent again.

```ts
// src/main.tsx
authorizationParams={{
  redirect_uri: window.location.origin,
  prompt: 'consent',
  audience: 'sandbox-ai-api',
}}
```

## Stack and structure

The UI stack is built using:

- [TypeScript][]
- [React][]
- [Vite][]
- [Jotai][] (state management)
- [styled-components][] (legacy styling; new code uses CSS Modules)

Some important directories and files:

- `src/resources/hooks/useInputPromptController.ts` — main submit logic; builds the request config and calls the appropriate API endpoint
- `src/resources/utils/buildRequestConfig.ts` — builds the Axios request config (URL, headers, body) for each endpoint type
- `src/resources/atoms.ts` — Jotai atoms; feature flags are persisted in `localStorage` via `atomWithStorage`
- `src/feature-flags/types.ts` — feature flag type definitions; `DEPRECATED_FLAGS` lists removed flags so stale `localStorage` values are cleaned up
- `src/resources/constants.ts` — API base URL and Auth0 configuration (environment-driven)
- [opentrons-ai-server][] — backend server

## API endpoints

The client calls one of four JSON endpoints depending on request type:

| Request type                 | Endpoint                              |
| ---------------------------- | ------------------------------------- |
| Update protocol (no files)   | `POST /api/chat/update-protocol`      |
| Create protocol (no files)   | `POST /api/chat/create-protocol`      |
| Chat completion (no files)   | `POST /api/chat/completion`           |
| Chat completion (with files) | `POST /api/chat/completion-multipart` |

## Feature flags

Feature flags are persisted in `localStorage` under the key `opentrons_ai_feature_flags`. Flags in `DEPRECATED_FLAGS` (`src/feature-flags/types.ts`) are cleaned up automatically so stale values do not affect behavior.

User-facing flags are toggled on the **Settings** page. The prerelease-only `enablePrereleaseMode` flag is exposed via the browser console:

```js
window.enablePrereleaseMode()
```

## Copy management

We use [i18next](https://www.i18next.com) for copy management. Translation strings live in `src/assets/localization/en/`.

## Testing

Tests run from the monorepo root with all other JS tests:

```shell
# run all JS tests
make test-js

# run only ai-client tests
make test-js-opentrons-ai-client

# run a specific file directly
pnpm vitest opentrons-ai-client/src/resources/hooks/
```

Test tasks accept these arguments:

| Argument | Default  | Description             | Example                                       |
| -------- | -------- | ----------------------- | --------------------------------------------- |
| watch    | `false`  | Run in watch mode       | `make test-js-opentrons-ai-client watch=true` |
| cover    | `!watch` | Calculate code coverage | `make test-js-opentrons-ai-client cover=true` |

## Links

[contributing-guide-setup]: ../CONTRIBUTING.md#development-setup
[typescript]: https://www.typescriptlang.org/
[react]: https://react.dev/
[vite]: https://vitejs.dev/
[jotai]: https://jotai.org/
[styled-components]: https://styled-components.com/
[opentrons-ai-server]: https://github.com/Opentrons/opentrons/tree/edge/opentrons-ai-server
