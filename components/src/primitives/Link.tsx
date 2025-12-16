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

const LinkComponent = ({
  external,
  ...props
}: ComponentProps<'a'> & LinkProps): JSX.Element => (
  <a
    {...props}
    {...(external === true && { target: '_blank', rel: 'noopener noreferrer' })}
    // eslint-disable-next-line react/forbid-dom-props
    style={{ textDecoration: 'none', cursor: 'pointer', ...props.style }}
  />
)

export const Link: FC<ComponentProps<'a'> & LinkProps> = withStyleProps(
  LinkComponent
) as FC<ComponentProps<'a'> & LinkProps>
