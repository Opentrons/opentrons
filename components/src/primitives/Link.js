// @flow
import styled from 'styled-components'

import type { StyledComponent } from 'styled-components'
import { styleProps, isntStyleProp } from './style-props'

import type { StyleProps } from './types'

export type LinkProps = {|
  external?: boolean,
  ...StyleProps,
|}

/**
 * Link primitive
 *
 * @component
 */
export const Link: StyledComponent<
  LinkProps,
  {||},
  HTMLAnchorElement
> = styled.a
  .withConfig({
    shouldForwardProp: p => isntStyleProp(p) && p !== 'external',
  })
  .attrs((props: LinkProps) => {
    return props.external === true
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {}
  })`
  text-decoration: none;
  ${styleProps}
`
