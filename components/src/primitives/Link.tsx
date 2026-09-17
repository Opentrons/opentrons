import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC, ReactNode } from 'react'
import type { StyleProps } from './types'

export interface LinkProps extends StyleProps {
  /** render link with target="_blank" */
  external?: boolean
}

const LinkComponent = ({
  external,
  ...props
}: ComponentProps<'a'> & LinkProps): ReactNode => (
  <a
    {...props}
    {...(external === true && { target: '_blank', rel: 'noopener noreferrer' })}
    // eslint-disable-next-line react/forbid-dom-props
    style={{
      whiteSpace: 'nowrap',
      textDecoration: 'none',
      cursor: 'pointer',
      ...props.style,
    }}
  />
)

/**
 * Link primitive
 *
 * @deprecated Layout/style primitives are deprecated. If there is a preexisting
 *   higher-level component that does what you want (e.g. from the Helix design system,
 *   or from your project's shared components), use that instead. If not, implement your
 *   own layout+styling with CSS modules and the semantically appropriate native HTML
 *   element (`<li>`, `<menu>`, `<p>`, `<div>`, etc).
 */
export const Link: FC<ComponentProps<'a'> & LinkProps> = withStyleProps(
  LinkComponent
) as FC<ComponentProps<'a'> & LinkProps>
