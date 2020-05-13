// @flow
import styled from 'styled-components'

import * as StyleProps from './style-props'

import type { StyledComponent } from 'styled-components'

export type BoxProps = {|
  ...StyleProps.ColorProps,
  ...StyleProps.SpacingProps,
  ...StyleProps.TypographyProps,
|}

/**
 * Box primitive
 *
 * @component
 */
export const Box: StyledComponent<BoxProps, {||}, HTMLDivElement> = styled.div`
  ${StyleProps.colorStyles}
  ${StyleProps.spacingStyles}
  ${StyleProps.typographyStyles}
`
