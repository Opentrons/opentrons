// @flow
import styled from 'styled-components'
import type { StyledComponent } from 'styled-components'

// props are string type for flexibility, but try to use constants for safety
export type TextProps = {|
  color?: string,
  fontSize?: string,
  fontWeight?: string,
  fontStyle?: string,
  lineHeight?: string,
|}

// TODO(mc, 2020-05-08): add variants (--font-body-2-dark, etc) as variant prop
// or as components that compose the base Text component

/**
 * Text primitive
 *
 * @component
 */
export const Text: StyledComponent<TextProps, {||}, HTMLElement> = styled.p`
  margin-top: 0;
  margin-bottom: 0;
  ${({ fontSize }) => (fontSize ? `font-size: ${fontSize};` : '')}
  ${({ fontWeight }) => (fontWeight ? `font-weight: ${fontWeight};` : '')}
  ${({ fontStyle }) => (fontStyle ? `font-style: ${fontStyle};` : '')}
  ${({ lineHeight }) => (lineHeight ? `line-height: ${lineHeight};` : '')}
  ${({ color }) => (color ? `color: ${color};` : '')}
`
