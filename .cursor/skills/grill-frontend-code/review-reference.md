# Opentrons Frontend Review Reference

This reference governs the architectural boundaries of Opentrons UI development.

## 1. Atomic Design Layers

Opentrons enforces strict boundaries across component directories. Detect any layer-crossing violations:

- **Atoms (`app/src/atoms`, `components/src/atoms`)**: Pure presentational elements.
  - _Criterion_: Must NOT import any other component. Must NOT import hooks that pull state from the global store (e.g., redux, react-query).
- **Molecules (`app/src/molecules`, `components/src/molecules`)**: Combinations of atoms.
  - _Criterion_: Can import atoms. Must NOT import organisms or pages.
- **Organisms (`app/src/organisms`, `components/src/organisms`)**: Functional blocks.
  - _Criterion_: Can leverage complex state hooks and orchestrate multiple molecules/atoms.

## 2. CSS Modules & Styles

Opentrons uses CSS Modules for component isolation to ensure styles don't leak.

- **Co-location**: A component `MyComponent.tsx` must have a co-located CSS Module file (e.g., `MyComponent.module.css` or `mycomponent.module.css`) in the same directory.
- **No Global Drift**: Standard HTML tags (e.g., `div`, `button`, `span`) must not be styled inside modules without a class selector, unless resetting.
- **Class Names**: Use camelCase for class names in CSS, and bind them via `styles.className`. Avoid raw string literals for class assignment where modules are present.

## 3. Web Accessibility (a11y)

Opentrons interfaces are used in physical lab environments. Accessibility is functional reliability.

- **Interactivity**: Any clickable element that is not a semantic `<button>` or `<a>` must be rejected. Do not allow `onClick` on a raw `<div>` without appropriate `role` and `tabIndex`.
- **Visual Labels**: Icon-only buttons (e.g., an X close button) must explicitly declare an `aria-label` or `aria-describedby`.
- **Dynamic States**: Loading indicators must possess `aria-busy="true"`.

## 4. TypeScript & Logic Rigor

- **Strict Types**: The `any` type is an automatic failure. If a type is genuinely polymorphic, enforce `unknown` and require type-guards.
- **Nullability**: Prefer explicit checks (`value !== null` / `value !== undefined`) when you need to distinguish them; `value != null` is acceptable shorthand for checking both `null` and `undefined` and is used throughout the codebase.
- **Ternary Ceiling**: Nested ternary operators (`condition ? a : condition2 ? b : c`) are strictly prohibited. Demand extraction into early returns or explicit local switch/if blocks.

## 5. Component API Design (Props Extension)

Standard HTML attributes must not be manually replicated. Components that wrap native HTML elements must explicitly extend native attributes to maintain web standards and prevent configuration creep.

- **Anti-Pattern (Manual Shadowing)**: Do not manually type ubiquitous props like `onClick`, `className`, `id`, or `style` in custom prop interfaces.
- **Enforced Pattern**: Always extend `React.ComponentPropsWithoutRef<'tag'>` (or `React.ComponentPropsWithRef<'tag'>` if forwarding refs).

```ts
// ❌ BAD: Manual and brittle replication
interface ButtonProps {
  label: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}

//  GOOD: Native type extension
interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  label: string // Only define custom business props here
}
```

## 6. Test Coverage & Rigor (Unprotected Code)

Every feature branch must guard against regression. Code without test coverage is an automatic failure.

- **Sibling Rule**: Any new component `MyComponent.tsx` or hook `useMyHook.ts` must be accompanied by a sibling `__tests__/MyComponent.test.tsx` or `MyComponent.test.ts` file within the same directory.
- **RTL Standards**: Opentrons uses React Testing Library.
  - Avoid testing internal state; always test observable behavior from the user's perspective (e.g., fireEvent/userEvent).
  - Enforce explicit MSW (Mock Service Worker) handlers for any network/API layer mock, rather than manual `jest.fn()` overrides of global fetch.

## 7. Modularization vs. Over-engineering (Over-baked Code)

Components must be lean, single-purpose, and modular. Do not write speculative code for future feature requirements.

- **The 300-Line Ceiling**: Any component file exceeding 300 lines of code (including styles and types) is an automatic trigger for structural review. Demand that the author split the file and extract sub-sections into dedicated Atoms or Molecules.
- **Single Responsibility**: If a component is handling both complex layouts, business logic fetching, and deep sub-UI states, it must be split regardless of line count.
- **Speculative Props**: Reject any prop, utility function, or configuration object added "for future flexibility" that is not actively utilized in the current PR's user stories.
- **YAGNI Enforced**: Lean on the side of minimal code. If a component can be achieved with standard primitives and design tokens without adding new custom wrapper functions, force the simpler path.
