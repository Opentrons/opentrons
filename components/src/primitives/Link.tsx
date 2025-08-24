import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

export interface LinkProps extends StyleProps {
  /** render link with target="_blank" */
  external?: boolean
}

/**
 * Link primitive
 *
 * @component
 */

const LinkComponent = (props: ComponentProps<'a'>): JSX.Element => (
  <a
    {...props}
    style={{ textDecoration: 'none', cursor: 'pointer', ...props.style }}
  />
)

export const Link: FC<ComponentProps<'a'> & StyleProps> = withStyleProps(
  LinkComponent
) as FC<ComponentProps<'a'> & StyleProps>
