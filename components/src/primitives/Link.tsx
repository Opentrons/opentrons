import styled from 'styled-components'

import { styleProps, isntStyleProp } from './style-props'

import type { StyledComponent } from 'styled-components'
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
export const Link: StyledComponent<LinkProps, {}, HTMLAnchorElement> = styled.a
  .withConfig({
    shouldForwardProp: p => isntStyleProp(p) && p !== 'external',
  })
  .attrs(
    (props: LinkProps): React.ReactNode => {
      return props.external === true
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {}
    }
  )`
  text-decoration: none;
  ${styleProps}
`
