import styled from 'styled-components'

import { styleProps, isntStyleProp } from './style-props'

import type { StyleProps, PrimitiveComponent } from './types'

export interface LinkProps extends StyleProps {
  /** render link with target="_blank" */
  external?: boolean
}

/**
 * Link primitive
 *
 * @component
 */
export const Link: PrimitiveComponent<'a', LinkProps> = styled.a
  .withConfig<LinkProps>({
    shouldForwardProp: p => isntStyleProp(p) && p !== 'external',
  })
  .attrs(
    (props: LinkProps): React.ComponentProps<PrimitiveComponent<'a'>> => {
      return props.external === true
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {}
    }
  )`
  text-decoration: none;
  cursor: pointer;
  ${styleProps}
`
