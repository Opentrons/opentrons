// @flow
import styled from 'styled-components'
import * as StyleProps from './style-props'

import type { StyledComponent } from 'styled-components'

export type TextProps = {|
  ...StyleProps.ColorProps,
  ...StyleProps.TypographyProps,
  ...StyleProps.SpacingProps,
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
  ${StyleProps.colorStyles}
  ${StyleProps.typographyStyles}
  ${StyleProps.spacingStyles}
`
