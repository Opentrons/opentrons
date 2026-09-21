---
name: css-modules
description: CSS Modules conventions, Stylelint rules, design tokens (spacing, colors, typography, border-radius), and patterns for the Opentrons monorepo. Use when working with .module.css files or styling React components in app/, components/, protocol-visualization/, protocol-designer/, or other JS packages.
---

# CSS Modules — Opentrons Conventions

## File Naming

File names are **lowercase**, no separators, suffixed with `.module.css`, and match the component name:

```markdown
ComponentName/
├── index.tsx
├── componentname.module.css
└── **tests**/
└── ComponentName.test.tsx
```

Examples: `navbar.module.css`, `labwarebutton.module.css`, `textareafield.module.css`

## Class Naming

Stylelint enforces the pattern `/^[a-z0-9_]+$/` — **snake_case only** (lowercase letters, digits, underscores).

Use a `component_element` or `element_modifier` structure:

```css
/* Base classes */
.button {
}
.slider_container {
}
.crumb_link {
}

/* State/modifier variants */
.button_active {
}
.textarea_error {
}
.title_text_center {
}
.crumb_link_inactive {
}
```

## Importing in Components

```tsx
import styles from './componentname.module.css'

export function MyComponent(): JSX.Element {
  return <div className={styles.wrapper}>content</div>
}
```

## Dynamic Styling with `clsx`

Use [clsx](https://github.com/lukeed/clsx) for combining or conditionally applying classes:

```tsx
import clsx from 'clsx'

import styles from './componentname.module.css'

export function MyButton({ isActive, isError }: Props): JSX.Element {
  const className = clsx(styles.button, {
    [styles.button_active]: isActive,
    [styles.button_error]: isError,
  })
  return <button className={className}>Click</button>
}
```

## Design Tokens (CSS Custom Properties)

All tokens are defined in `components/src/styles/global.css`. **Always use these variables** instead of hard-coding values for colors, spacing, typography, and border-radius.

### Spacing

| Variable        | Value           |
| --------------- | --------------- |
| `--spacing-2`   | 0.125rem (2px)  |
| `--spacing-4`   | 0.25rem (4px)   |
| `--spacing-6`   | 0.375rem (6px)  |
| `--spacing-8`   | 0.5rem (8px)    |
| `--spacing-10`  | 0.625rem (10px) |
| `--spacing-12`  | 0.75rem (12px)  |
| `--spacing-16`  | 1rem (16px)     |
| `--spacing-20`  | 1.25rem (20px)  |
| `--spacing-24`  | 1.5rem (24px)   |
| `--spacing-32`  | 2rem (32px)     |
| `--spacing-40`  | 2.5rem (40px)   |
| `--spacing-44`  | 2.75rem (44px)  |
| `--spacing-48`  | 3rem (48px)     |
| `--spacing-60`  | 3.75rem (60px)  |
| `--spacing-68`  | 4.25rem (68px)  |
| `--spacing-80`  | 5rem (80px)     |
| `--spacing-120` | 7.5rem (120px)  |

### Colors

**Core:** `--white` (#fff), `--black-90` (#16212d), `--black-80` (#24313f), `--black-70` (#39495b)

**Grey:** `--grey-10` through `--grey-60` (10, 20, 30, 35, 40, 50, 55, 60)

**Blue:** `--blue-10` through `--blue-60` (10, 20, 30, 35, 40, 50, 55, 60)

**Purple:** `--purple-20` through `--purple-60` (20, 30, 35, 40, 50, 55, 60)

**Green:** `--green-20` through `--green-60` (20, 30, 35, 40, 50, 60)

**Red:** `--red-20` through `--red-60` (20, 30, 35, 40, 50, 55, 60)

**Yellow:** `--yellow-20` through `--yellow-60` (20, 30, 35, 40, 50, 60)

**Flex brand:** `--flex-20` through `--flex-60` (20, 30, 35, 40, 50, 55, 60)

**Semi-transparent white:** `--transparent-white-20` through `--transparent-white-80` (20, 30, 50, 80)

**Semi-transparent black:** `--transparent-black-10` through `--transparent-black-80` (10, 20, 30, 40, 50, 60, 80)

**transparent:** `--transparent`

> Some colors (green, purple) have touchscreen variants that activate when `components/src/styles/global.css` applies the `.enable_touchscreen_colors` class. The default values are non-touchscreen.

### Border Radius

`--border-radius-2`, `--border-radius-4`, `--border-radius-8`, `--border-radius-12`, `--border-radius-16`, `--border-radius-40`, `--border-radius-full` (pill/circle)

### Typography

**Font size:** `--font-size-9`, `--font-size-10`, `--font-size-11`, `--font-size-12`, `--font-size-13`, `--font-size-14`, `--font-size-15`, `--font-size-16`, `--font-size-19`, `--font-size-20`, `--font-size-22`, `--font-size-23`, `--font-size-24`, `--font-size-26`, `--font-size-28`, `--font-size-32`, `--font-size-38`, `--font-size-39`, `--font-size-80`

**Font weight:** `--font-weight-light` (300), `--font-weight-regular` (400), `--font-weight-semi-bold` (600), `--font-weight-bold` (700)

**Line height:** `--line-height-12`, `--line-height-16`, `--line-height-18`, `--line-height-20`, `--line-height-24`, `--line-height-28`, `--line-height-36`, `--line-height-42`, `--line-height-48`, `--line-height-96`

## Where to Use Tokens vs Explicit Values

| Property                                     | Use token?                  | Example                        |
| -------------------------------------------- | --------------------------- | ------------------------------ |
| `color`, `background-color`, `border-color`  | **Yes**                     | `var(--blue-50)`               |
| `padding`, `margin`, `gap`                   | **Yes**                     | `var(--spacing-16)`            |
| `border-radius`                              | **Yes**                     | `var(--border-radius-8)`       |
| `font-size`                                  | **Yes**                     | `var(--font-size-p)`           |
| `font-weight`                                | **Yes**                     | `var(--font-weight-semi-bold)` |
| `line-height`                                | **Yes**                     | `var(--line-height-20)`        |
| `width`, `height`, `max-width`, `min-height` | **No** — use explicit `rem` | `15rem`, `100vh`               |
| `box-shadow`                                 | **No** — use `px`           | `0 0 0 2px var(--blue-50)`     |

## Unit Rules

- **rem** for all dimensions — divide design-spec px by 16 (`240px / 16 = 15rem`)
- **px** only for `box-shadow` values and `<img>` tag dimensions
- Prefer `padding` over `margin` for wrapper and container elements
- Avoid complex `calc()` expressions

## State & Pseudo-Class Handling

```css
.button:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--blue-50);
}

.button:hover:not(:disabled) {
  background-color: var(--grey-10);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input:focus {
  border-color: var(--blue-50);
}
```

Always guard hover styles with `:not(:disabled)` on interactive elements.

## CSS Modules Features

### Composition

Stylelint allows the `composes` property for class composition:

```css
.base_button {
  padding: var(--spacing-8) var(--spacing-16);
  border-radius: var(--border-radius-4);
}

.primary_button {
  composes: base_button;
  background-color: var(--blue-50);
  color: var(--white);
}
```

### Global Selectors

Use `:global()` to target non-module classes (e.g., from React Router or third-party libraries):

```css
.nav_link:global(.active) {
  color: var(--blue-50);
}
```

## Stylelint Configuration

The repo uses `stylelint-config-standard` + `stylelint-config-idiomatic-order` (property ordering). Key enforced rules:

- Class selector pattern: `/^[a-z0-9_]+$/`
- Max 4 decimal places for numbers (except dimension properties like `width`, `height`, `flex`)
- Standard CSS property ordering (idiomatic order)
- `@value` at-rule is still allowed but deprecated — avoid in new code

### Tips: Common Stylelint Fixes

**Zero lengths must have no unit** (`length-zero-no-unit`):

```css
/* ✖ Unexpected unit */
box-shadow: 0px 3px 6px rgb(0 0 0 / 23%);

/* ✔ Use bare 0 — no px/rem/etc. */
box-shadow: 0 3px 6px rgb(0 0 0 / 23%);
```

**Use modern `rgb` notation** (`color-function-alias-notation`, `color-function-notation`):

```css
/* ✖ rgba + comma-separated args are legacy */
box-shadow: 0 3px 6px rgba(0, 0, 0, 23%);

/* ✔ Prefer rgb with space-separated channels and / alpha */
box-shadow: 0 3px 6px rgb(0 0 0 / 23%);
```

## Linting and Formatting

```bash
# Lint all CSS
make lint-css

# Auto-fix all CSS
make format-css

# Lint a single file
pnpm stylelint path/to/componentname.module.css

# Auto-fix a single file
pnpm stylelint path/to/componentname.module.css --fix
```

Always run `make lint-css` and fix any issues before committing.

## Legacy Patterns (Do Not Introduce)

- `components/src/styles/borders.module.css` — old border tokens (`--bd-radius-*`, `--bd-width-*`, `--shadow-lvl-*`). Use `global.css` tokens instead.
- `components/src/styles/typography.module.css` — old typography tokens (`--fs-*`, `--fw-*`, `--lh-*`). Use `global.css` tokens instead.
- `styled-components` — the codebase is migrating away. Always use CSS Modules for new styles.
- `@value` declarations — still parsed by stylelint but deprecated. Use CSS custom properties.
