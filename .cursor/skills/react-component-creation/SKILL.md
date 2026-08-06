---
name: react-component-creation
description: Component creation checklist and ai-client-specific patterns for React .tsx files in opentrons-ai-client/ and protocol-designer/. Use when creating new React components in these packages.
---

# React Component Creation Checklist

General TypeScript, React, styling, testing, and import conventions are in the `opentrons-typescript` skill. PD-specific architecture is in the `protocol-designer` skill. CSS Modules details are in the `css-modules` skill. This file covers the **component creation workflow** and **opentrons-ai-client specifics**.

## Before Creating a New Component

1. Consider the component's purpose, functionality, and design
2. Check if a similar component already exists in:
   - `components/src/atoms/`, `components/src/molecules/`, `components/src/organisms/` (shared library)
   - `<project>/src/components/atoms/`, `molecules/`, `organisms/` (project-local)
3. If an existing component can be extended or composed, prefer that over creating a new one

## Component File Structure

```
ComponentName/
├── index.tsx
├── componentname.module.css
└── __tests__/
    └── ComponentName.test.tsx
```

## opentrons-ai-client Specifics

### Path Alias

The ai-client uses `/ai-client/` as its path alias (mapped to `opentrons-ai-client/src/`):

```typescript
import { AttachedFileItem } from '/ai-client/atoms/AttachedFileItem'

import type { ChatData } from '/ai-client/resources/types'
```

### Testing

Use `renderWithProviders` from the ai-client testing utils:

```typescript
import { renderWithProviders } from '/ai-client/__testing-utils__'
```

### Running Tests

```bash
pnpm vitest opentrons-ai-client/src/path/to/file
pnpm vitest opentrons-ai-client/src/folder/
```

### Running Stylelint

```bash
pnpm stylelint opentrons-ai-client/src/path/to/file.module.css
```
