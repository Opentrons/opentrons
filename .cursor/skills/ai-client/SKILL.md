---
name: ai-client
description: Conventions for the opentrons-ai-client React/TypeScript frontend — project structure, API integration, state management (Jotai), feature flags, types, and testing. Use when working with files in opentrons-ai-client/ or discussing the AI client application.
---

# AI Client Instructions

## Overview

`opentrons-ai-client` is a React/TypeScript single-page application that generates and updates Opentrons protocols from natural language descriptions. It lives in the monorepo and is built with Vite.

Deployed environments: **staging** (`staging.opentrons.ai`) and **prod** (`ai.opentrons.com`).

## Project Structure

```
opentrons-ai-client/
├── src/
│   ├── OpentronsAI.tsx           # Root component, Auth0 bootstrap, feature flag sync
│   ├── main.tsx                  # Auth0 provider, router, app entry
│   ├── analytics/                # Mixpanel event tracking
│   ├── assets/localization/en/   # i18next translation strings
│   ├── components/               # atoms/, molecules/, organisms/
│   ├── pages/                    # Chat, CreateProtocol, UpdateProtocol, Landing, Settings
│   ├── resources/
│   │   ├── atoms.ts              # Jotai atoms (app-wide state)
│   │   ├── constants.ts          # API base URLs and Auth0 config per environment
│   │   ├── types.ts              # Shared TypeScript types (ChatData, CreatePrompt, etc.)
│   │   ├── hooks/
│   │   │   ├── useInputPromptController.ts  # Main submit logic
│   │   │   ├── useGetAccessToken.ts         # Auth0 token fetching
│   │   │   ├── useApiCall.ts                # Axios wrapper (callApi, data, isLoading, error)
│   │   │   └── useAttachFiles.ts            # File attachment handling
│   │   └── utils/
│   │       ├── buildRequestConfig.ts        # Builds Axios config per endpoint type
│   │       ├── buildChatHistory.ts          # Formats chat history for the API
│   │       ├── createUserInput.ts           # Creates ChatData for user turns
│   │       ├── protocolUtils.ts             # Prompt builders for create/update
│   │       └── resolveErrorMessage.ts       # Maps API error_type to user-facing strings
│   └── feature-flags/            # Feature flag types and DEPRECATED_FLAGS cleanup
└── vite.config.mts
```

## Types — Use camelCase Throughout

All types in `src/resources/types.ts` use **camelCase** field names. The API request/response bodies also use camelCase. Do not use snake_case for any new TypeScript types or API payload fields.

Key types:

| Type           | Purpose                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| `ChatData`     | A single turn in the chat display (user or assistant)                     |
| `Chat`         | A history entry sent to the server (`role`, `content`, `protocolContent`) |
| `CreatePrompt` | Atom shape for the create-protocol form state                             |
| `UpdatePrompt` | Atom shape for the update-protocol form state                             |

## State Management (Jotai)

Key atoms in `src/resources/atoms.ts`:

| Atom                     | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `chatDataAtom`           | All turns displayed in the chat UI          |
| `chatHistoryAtom`        | History sent to the server in API requests  |
| `createProtocolChatAtom` | Create-protocol form values                 |
| `updateProtocolChatAtom` | Update-protocol form values                 |
| `featureFlagsAtom`       | Feature flags (persisted to `localStorage`) |
| `feedbackModalAtom`      | Whether the feedback modal is open          |

`tokenAtom` has been removed. Always use `useGetAccessToken()` to fetch a fresh token before making API calls.

## API Integration

The client communicates with the server via a standard JSON HTTP API. Endpoint selection is handled in `buildRequestConfig.ts`.

| Request type                 | Endpoint                              |
| ---------------------------- | ------------------------------------- |
| Update protocol (no files)   | `POST /api/chat/update-protocol`      |
| Create protocol (no files)   | `POST /api/chat/create-protocol`      |
| Chat completion (no files)   | `POST /api/chat/completion`           |
| Chat completion (with files) | `POST /api/chat/completion-multipart` |

The `useInputPromptController` hook is the single entry point for all submissions. It:

1. Calls `getAccessToken()` to get a fresh token before each request
2. Calls `buildRequestConfig()` to assemble the Axios config
3. Calls `callApi(config)` from `useApiCall`
4. On completion, updates `chatDataAtom` and `chatHistoryAtom`

## Authentication

- Use `useGetAccessToken()` (not the removed `tokenAtom`) whenever a token is needed
- `getAccessToken()` is async — always `await` it and wrap in try/catch
- `FeedbackModal` and other components that POST independently also use `useGetAccessToken()`

## Environment-Driven URLs

`constants.ts` exports endpoint constants for three environments (`LOCAL_*`, `STAGING_*`, `PROD_*`). `buildRequestConfig.ts` uses `_NODE_ENV_` (a Vite define) via `pickEndpoint()` to select the right URL.

## Feature Flags

Feature flags live in `featureFlagsAtom` and are persisted to `localStorage`. Flags listed in `DEPRECATED_FLAGS` (`src/feature-flags/types.ts`) are automatically cleaned up on startup.

User-facing flags are toggled on the **Settings** page. The `enablePrereleaseMode` flag is toggled via `window.enablePrereleaseMode()` in the browser console.

## useEffect Exhaustive-Deps Convention

New code wraps `useEffect` callbacks in the multi-line form and adds a `FIXME` comment for any suppressed exhaustive-deps lint rule:

```ts
useEffect(
  () => {
    // ...
  },
  // FIXME(YYYY-MM-DD): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [dep1, dep2]
)
```

## Dev Commands

Run from the **monorepo root**:

```bash
make -C opentrons-ai-client dev     # Start Vite dev server
make test-js-opentrons-ai-client    # Run unit tests
make format-js                      # Prettier auto-fix
make lint-js                        # ESLint + Prettier check
make lint-css                       # Stylelint check
make check-js                       # TypeScript type check
```
