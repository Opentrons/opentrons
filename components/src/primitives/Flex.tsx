import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

/**
 * Flex primitive
 *
 * @component
 */
const FlexComponent = (props: ComponentProps<'div'>): JSX.Element => (
  <div {...props} style={{ display: 'flex', ...props.style }} />
)

// Explicitly type the Flex component to avoid type inference issues
export const Flex: FC<ComponentProps<'div'> & StyleProps> = withStyleProps(
  FlexComponent
) as FC<ComponentProps<'div'> & StyleProps>
