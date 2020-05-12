// @flow
import styled from 'styled-components'
import type { StyledComponent } from 'styled-components'

// props are string type for flexibility, but try to use constants for safety
// TODO(mc, 2020-05-11): move common style interpolations into common location
export type TextProps = {|
  color?: string,
  fontSize?: string,
  fontWeight?: number | string,
  fontStyle?: string,
  lineHeight?: number | string,
|}

// TODO(mc, 2020-05-08): add variants (--font-body-2-dark, etc) as variant prop
// or as components that compose the base Text component

/**
 * Text primitive
 *
 * @component
 */
export const Text: StyledComponent<
  TextProps,
  {||},
  HTMLParagraphElement
> = styled.p`
  margin-top: 0;
  margin-bottom: 0;
  ${({ fontSize }) => (fontSize ? `font-size: ${fontSize};` : '')}
  ${({ fontWeight }) => (fontWeight ? `font-weight: ${fontWeight};` : '')}
  ${({ fontStyle }) => (fontStyle ? `font-style: ${fontStyle};` : '')}
  ${({ lineHeight }) => (lineHeight ? `line-height: ${lineHeight};` : '')}
  ${({ color }) => (color ? `color: ${color};` : '')}
`
