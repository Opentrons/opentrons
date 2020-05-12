// @flow
import * as React from 'react'
import styled from 'styled-components'
import type { StyledComponent } from 'styled-components'

// props are string type for flexibility, but try to use constants for safety
export type LinkProps = {|
  href: string,
  external?: boolean,
  color?: string,
  fontSize?: string,
  fontWeight?: number | string,
  fontStyle?: string,
  lineHeight?: number | string,
|}

// TODO(mc, 2020-05-11): move common style interpolations into common location
const StyledLink: StyledComponent<
  LinkProps,
  {||},
  HTMLAnchorElement
> = styled.a`
  text-decoration: none;
  ${({ fontSize }) => (fontSize ? `font-size: ${fontSize};` : '')}
  ${({ fontWeight }) => (fontWeight ? `font-weight: ${fontWeight};` : '')}
  ${({ fontStyle }) => (fontStyle ? `font-style: ${fontStyle};` : '')}
  ${({ lineHeight }) => (lineHeight ? `line-height: ${lineHeight};` : '')}
  ${({ color }) => (color ? `color: ${color};` : '')}
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
