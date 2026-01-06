import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

/**
 * Simple Box atom. Renders a `div` by default and accepts all primitive styling props.
 *
 * @component
 */

const BoxComponent = (props: ComponentProps<'div'>): JSX.Element => (
  <div {...props} style={{ minWidth: 0, ...props.style }} />
)

export const Box: FC<ComponentProps<'div'> & StyleProps> = withStyleProps(
  BoxComponent
) as FC<ComponentProps<'div'> & StyleProps>
