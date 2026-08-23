import { createElement } from 'react'

import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC, ReactNode } from 'react'
import type { StyleProps } from './types'

const TextComponent = ({
  as,
  color,
  ...props
}: ComponentProps<'p'> & { as?: string }): ReactNode => {
  const Component = as || 'p'
  return createElement(Component, {
    ...props,
    style: {
      marginTop: 0,
      marginBottom: 0,
      ...(color != null ? { color } : {}),
      ...props.style,
    },
  })
}

/**
 * Text primitive
 *
 * @component
 *
 * @deprecated Layout/style primitives are deprecated. If there is a preexisting
 *   higher-level component that does what you want (e.g. from the Helix design system,
 *   or from your project's shared components), use that instead. If not, implement your
 *   own layout+styling with CSS modules and the semantically appropriate native HTML
 *   element (`<li>`, `<menu>`, `<p>`, `<div>`, etc).
 */
export const Text: FC<ComponentProps<'p'> & StyleProps & { as?: string }> =
  withStyleProps(TextComponent) as FC<
    ComponentProps<'p'> & StyleProps & { as?: string }
  >
