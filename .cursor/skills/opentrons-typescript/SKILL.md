---
name: opentrons-typescript
description: TypeScript conventions, React patterns, testing, styling, and import rules for the Opentrons monorepo JS/TS packages. Use when working with TypeScript or React files in app/, components/, shared-data/, step-generation/, protocol-designer/, protocol-visualization/, opentrons-ai-client/, or other JS/TS packages.
---

# Opentrons Monorepo — TypeScript Conventions

Node.js, Pnpm, Python setup, teardown, and troubleshooting are in the always-apply `monorepo-setup` rule.

## Monorepo Structure

Pnpm workspaces monorepo with 15 TypeScript packages. No Lerna/Nx/Turbo — uses Pnpm workspaces + TypeScript project references.

### Packages

| Package                             | Directory                 | Type                              |
| ----------------------------------- | ------------------------- | --------------------------------- |
| `@opentrons/app`                    | `app/`                    | React app                         |
| `@opentrons/app-shell`              | `app-shell/`              | Electron shell                    |
| `@opentrons/app-shell-odd`          | `app-shell-odd/`          | Electron shell (ODD)              |
| `@opentrons/components`             | `components/`             | React UI components library       |
| `@opentrons/api-client`             | `api-client/`             | Pure TS library                   |
| `@opentrons/react-api-client`       | `react-api-client/`       | React hooks library               |
| `@opentrons/discovery-client`       | `discovery-client/`       | Pure TS (Node)                    |
| `@opentrons/shared-data`            | `shared-data/`            | Pure TS/JS data library           |
| `@opentrons/step-generation`        | `step-generation/`        | Pure TS library                   |
| `@opentrons/labware-library`        | `labware-library/`        | React app                         |
| `@opentrons/labware-designer`       | `labware-designer/`       | React app                         |
| `opentrons-ai-client`               | `opentrons-ai-client/`    | React app                         |
| `protocol-designer`                 | `protocol-designer/`      | React app                         |
| `@opentrons/protocol-visualization` | `protocol-visualization/` | React library (protocol viz, WIP) |
| `@opentrons/usb-bridge-client`      | `usb-bridge/node-client/` | Pure TS (Node)                    |

### Dependency Graph

`shared-data` is the foundation. Nothing should import "up" the tree:

```markdown
shared-data
├── step-generation
├── components
├── api-client → react-api-client
└── discovery-client
↓
protocol-visualization (scaffold; depends on components + shared-data + step-generation)
↓
app, protocol-designer, labware-library, opentrons-ai-client (leaf apps)
```

## TypeScript Configuration

All packages extend `tsconfig-base.json`:

- **Target/Module:** ESNext
- **Strict:** true (no `any`, strict null checks)
- **JSX:** preserve (Vite handles transform)
- **Declarations:** emitDeclarationOnly, composite for project references
- **Module resolution:** node

Each package defines `rootDir: "src"`, `outDir: "lib"`, and references its dependencies.

## Code Style (Prettier)

Enforced by Prettier with `@ianvs/prettier-plugin-sort-imports`:

- **No semicolons**
- **Single quotes** (double quotes in JSX)
- **Trailing commas:** ES5
- **Print width:** 80, **Tab width:** 2
- **Line endings:** LF

## Import Conventions

### Order (auto-sorted by Prettier plugin)

1. React imports (`import { useState } from 'react'`)
2. Third-party packages
3. `@opentrons/*` packages
4. Package-local absolute imports (`/app/*`, `/protocol-designer/*`, `/ai-client/*`)
5. Relative imports
6. `import type` (type-only imports, same sub-ordering)
7. Asset imports (images, CSS)

### Cross-Package Imports

Use the `@opentrons/` scope. These resolve to source via Vite aliases in dev/test:

```typescript
import { Flex, SPACING } from '@opentrons/components'
import { getPipetteSpecsV2 } from '@opentrons/shared-data'

import type { PipetteName } from '@opentrons/shared-data'
```

### Intra-Package Absolute Imports

Each app has a path alias (configured in tsconfig + Vite):

- `app/` → `/app/*`
- `protocol-designer/` → `/protocol-designer/*`
- `opentrons-ai-client/` → `/ai-client/*`

```typescript
// Good — absolute import within app
import { useRobot } from '/app/resources/robots'

// Bad — deep relative paths across features
import { useRobot } from '../../../resources/robots'
// Acceptable — relative for nearby files in the same feature
import { utils } from './utils'
```

### No Default Exports

ESLint enforces `import/no-default-export`. Always use named exports. Exceptions: config files (`vite.config.mts`, `*.stories.tsx`).

### Lodash

Import individual functions only:

```typescript
// Good — imports a specific function
import mapValues from 'lodash/mapValues'
```

```typescript
// Bad — imports entire library
import { mapValues } from 'lodash'
```

### Type Imports

Always use `import type` for type-only imports:

```typescript
import type { LabwareDefinition2 } from '@opentrons/shared-data'
```

## React Component Patterns

### Function Declarations (not arrows)

```typescript
interface MyComponentProps {
  title: string
  onClose: () => void
}

export function MyComponent({ title, onClose }: MyComponentProps): JSX.Element {
  return <div>{title}</div>
}
```

- Named function declarations, not arrow functions, for components
- Props interface named `<ComponentName>Props`
- Always destructure props in the function signature

### Atomic Design Hierarchy

Components are organized as `atoms/` → `molecules/` → `organisms/` → `pages/`. Custom ESLint rule `opentrons/no-imports-up-the-tree-of-life` prevents importing up the hierarchy:

- atoms must NOT import from molecules, organisms, or pages
- molecules must NOT import from organisms or pages
- organisms must NOT import from pages

### Application Boundaries (`app/` specific)

The `app` package separates Desktop and ODD (On-Device Display) UIs. ESLint rule `opentrons/no-imports-across-applications` prevents cross-contamination between `/Desktop/`, `/ODD/`, and shared code.

### Component Library (`@opentrons/components`)

**Do not use primitives from the shared component library when you create a new component from zero.**
Primitives are located in `components/src/primitives`.
Use primitives if you update an existing component or fix an existing component for layout and common UI:

```typescript
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'
```

### Hooks

- `useSelector` / `useDispatch` from `react-redux`
- `useTranslation` from `react-i18next` for i18n
- Custom hooks prefixed with `use*`
- Never call hooks conditionally
- ESLint enforces `react-hooks/rules-of-hooks` (error) and `react-hooks/exhaustive-deps` (warn)

## Styling

### CSS Modules (preferred for new code)

- File: `<componentname>.module.css` (lowercase, no separators)
- Classes: `snake_case` (enforced by Stylelint: `/^[a-z0-9_]+$/`)
- Use CSS custom properties from the design system (spacing, colors, typography, border-radius)
- Use `clsx` for conditional classes
- **Never use inline styles** in components (only in `*.stories.tsx`)

### styled-components (legacy)

Some packages still use `styled-components@5.3.6`. Do not introduce new styled-components — use CSS Modules for new code.

### Design System Tokens

```css
/* Spacing */
padding: var(--spacing-8);
gap: var(--spacing-16);

/* Colors */
color: var(--grey-60);
background: var(--white);

/* Typography */
font-size: var(--font-size-p);
font-weight: var(--font-weight-semi-bold);

/* Border radius */
border-radius: var(--border-radius-8);

/* Width/height — use explicit rem values, NOT variables */
width: 15rem;
```

## Testing

### Framework

- **Vitest 2.1.9** (not Jest) — `vi.fn()`, `vi.mock()`, `vi.mocked()`
- **@testing-library/react 16.3.0** — `screen`, `fireEvent`, `renderHook`
- **@testing-library/user-event 14.6.1**
- **vitest-when 0.5.0** for conditional mocking
- **jsdom** test environment (global `vitest.config.mts`)

### Test File Structure

```markdown
FeatureOrComponent/
├── index.tsx (or module.ts)
└── **tests**/
└── FeatureName.test.tsx
```

### renderWithProviders

React component tests MUST use `renderWithProviders` (wraps Redux Provider + QueryClientProvider + optional i18n), not plain `render`:

```typescript
import { renderWithProviders } from '/app/__testing-utils__'  // or /protocol-designer/__testing-utils__
import { i18n } from '/app/i18n'
import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof MyComponent>) => {
  return renderWithProviders(<MyComponent {...props} />)[0]
}

describe('MyComponent', () => {
  let props: ComponentProps<typeof MyComponent>

  beforeEach(() => {
    props = { /* defaults */ }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the button', () => {
    render(props)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders the text', () => {
    render(props)
    screen.getByText('Opentrons Flex')
  })
})
```

### Mocking

- `vi.mock()` at file top for module mocks
- `vi.mocked(fn).mockReturnValue(...)` for typed mocks
- `vi.clearAllMocks()` in `afterEach` (always)

### Queries

- Prefer `screen.getByRole`, `screen.getByText`, `screen.getByTestId`
- Never use `container.querySelector`
- `data-testid` format: `ComponentName_ElementType`

## Makefile Targets

### Per-Package (run from the package directory)

Each package has a `Makefile` with some or all of:

| Target          | Description                   |
| --------------- | ----------------------------- |
| `make dev`      | Start Vite dev server         |
| `make build`    | Production build              |
| `make clean`    | Remove build output           |
| `make test`     | Run tests (delegates to root) |
| `make test-cov` | Run tests with coverage       |

### Root Makefile (run from monorepo root)

| Target                            | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `make setup-js`                   | Install all JS deps (`pnpm`)                                       |
| `make test-js`                    | Run ALL JS tests                                                   |
| `make test-js-<project>`          | Run tests for one project (e.g., `make test-js-protocol-designer`) |
| `make lint-js`                    | ESLint + Prettier check                                            |
| `make lint-js-eslint`             | ESLint only                                                        |
| `make lint-js-prettier`           | Prettier only                                                      |
| `make lint-css`                   | Stylelint all CSS                                                  |
| `make format-js`                  | Auto-format with Prettier                                          |
| `make format-css`                 | Auto-fix CSS with Stylelint                                        |
| `make check-js` / `make build-ts` | TypeScript type-check (`tsc --build`)                              |
| `make clean-ts`                   | Clean TS build output                                              |
| `make circular-dependencies-js`   | Check circular imports (madge)                                     |

### Running Tests Directly

```bash
# Single file
pnpm vitest app/src/organisms/__tests__/MyComponent.test.tsx

# Entire package
pnpm vitest protocol-designer/

# Watch mode
pnpm vitest --watch app/src/

# Specific project via Make
make test-js-app tests="src/organisms/__tests__/MyComponent.test.tsx"
```

### Linting Specific Files

```bash
pnpm eslint path/to/file.tsx
pnpm stylelint path/to/file.module.css
pnpm prettier --check path/to/file.tsx
pnpm prettier --write path/to/file.tsx   # auto-fix
```

## Event Handlers

```typescript
import type { MouseEvent } from 'react'

// Named handlers for complex logic
const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
  e.preventDefault()
  onClick()
}
return <button onClick={handleClick}>Click me</button>

// Direct reference for simple cases
return <button onClick={onClick}>Click me</button>

// Bad — unnecessary wrapper
return <button onClick={() => onClick()}>Click me</button>
```

Always specify `type` on buttons in forms:

```typescript
<button type="button" onClick={handleAttach}>Attach</button>
<button type="submit">Submit Form</button>
```

## Constants & Magic Numbers

Extract all constants — avoid inline magic numbers:

```typescript
// Good
const UNIT_MB = 1024 * 1024
const MAX_FILES = 5

export const FILE_SIZE_LIMITS = {
  pdf: 10 * UNIT_MB,
  csv: 2 * UNIT_MB,
} as const

// Bad
const sizeMB = Math.round(sizeLimit / (1024 * 1024))
```

Use object lookups for simple mappings instead of switch statements.

## Component Architecture

Separate router logic from presentation for testability:

```typescript
// Router-aware wrapper
function AppWithRouter() {
  const location = useLocation()
  return <AppContent isOnChatPage={location.pathname === '/chat'} />
}

// Pure presentation (easily testable)
function AppContent({ isOnChatPage }: { isOnChatPage: boolean }) {
  return <div>{!isOnChatPage ? <Footer /> : null}</div>
}
```

## Common Pitfalls

- Do NOT use `any` — strict TypeScript is enforced
- Do NOT use default exports (except config files and stories)
- Do NOT use class components — functional only
- Do NOT use arrow functions for component definitions
- Do NOT use implicit truthiness for null checks — use explicit `!= null`
- Do NOT import the full lodash package — use granular imports
- Do NOT use inline styles in components
- Do NOT use `querySelector` in tests
- Do NOT introduce new styled-components — use CSS Modules
- Do NOT import up the atomic design hierarchy (atoms ← molecules ← organisms ← pages)
- Do NOT skip `afterEach(() => vi.clearAllMocks())` in test suites
- Do NOT use semicolons (Prettier removes them)
- Do NOT use `console.log` or `debugger` in committed code
- Do NOT omit curly braces for control statements — ESLint `curly` rule enforces braces for all `if`, `else`, `for`, `while`, and `do` blocks
- Do NOT use primitives (primitives are located in `components/src/primitives`) for new component - use HTML 5 tags and CSS Modules
- Do NOT use margins to create a layout in a component - use padding and gap
- Do NOT use a conditional statement for `aria-label`
- Do NOT use a nested ternary in non-component render code
