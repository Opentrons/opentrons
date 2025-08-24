import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

/**
 * Text primitive
 *
 * @component
 */

const TextComponent = (props: ComponentProps<'p'>): JSX.Element => (
  <p {...props} style={{ marginTop: 0, marginBottom: 0, ...props.style }} />
)

export const Text: FC<ComponentProps<'p'> & StyleProps> = withStyleProps(
  TextComponent
) as FC<ComponentProps<'p'> & StyleProps>
