// @flow
import * as React from 'react'
import styled from 'styled-components'

import * as StyleProps from './style-props'

import type { StyledComponent } from 'styled-components'

// props are string type for flexibility, but try to use constants for safety
export type LinkProps = {|
  ...StyleProps.ColorProps,
  ...StyleProps.TypographyProps,
  ...StyleProps.SpacingProps,
  href: string,
  external?: boolean,
|}

const StyledLink: StyledComponent<
  LinkProps,
  {||},
  HTMLAnchorElement
> = styled.a`
  text-decoration: none;
  ${StyleProps.colorStyles}
  ${StyleProps.typographyStyles}
  ${StyleProps.spacingStyles}
`

type StyledLinkProps = React.ElementProps<typeof StyledLink>

/**
 * Link primitive
 */
export const Link = React.forwardRef<StyledLinkProps, HTMLAnchorElement>(
  (props: StyledLinkProps, ref) => {
    const { external, ...styleProps } = props
    const linkProps = external
      ? { ...styleProps, target: '_blank', rel: 'noopener noreferrer' }
      : styleProps

    return <StyledLink ref={ref} {...linkProps} />
  }
)
