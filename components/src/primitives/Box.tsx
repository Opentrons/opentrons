import { forwardRef } from 'react'

import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

const BoxComponent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  (props, ref) => (
    <div ref={ref} {...props} style={{ minWidth: 0, ...props.style }} />
  )
)

/**
 * Simple Box atom. Renders a `div` by default and accepts all primitive styling props.
 *
 * @component
 *
 * @deprecated Layout/style primitives are deprecated. If there is a preexisting
 *   higher-level component that does what you want (e.g. from the Helix design system,
 *   or from your project's shared components), use that instead. If not, implement your
 *   own layout+styling with CSS modules and the semantically appropriate native HTML
 *   element (`<li>`, `<menu>`, `<p>`, `<div>`, etc).
 */
export const Box: FC<ComponentProps<'div'> & StyleProps> = withStyleProps(
  BoxComponent
) as FC<ComponentProps<'div'> & StyleProps>
