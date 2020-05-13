// @flow
import styled from 'styled-components'

import * as StyleProps from './style-props'

import type { StyledComponent } from 'styled-components'

export const ALIGN_NORMAL = 'normal'
export const ALIGN_START = 'start'
export const ALIGN_END = 'end'
export const ALIGN_FLEX_START = 'flex-start'
export const ALIGN_FLEX_END = 'flex-end'
export const ALIGN_CENTER = 'center'
export const ALIGN_BASELINE = 'baseline'
export const ALIGN_STRETCH = 'stretch'

export const JUSTIFY_NORMAL = 'normal'
export const JUSTIFY_START = 'start'
export const JUSTIFY_END = 'end'
export const JUSTIFY_FLEX_START = 'flex-start'
export const JUSTIFY_FLEX_END = 'flex-end'
export const JUSTIFY_CENTER = 'center'
export const JUSTIFY_SPACE_BETWEEN = 'space-between'
export const JUSTIFY_SPACE_AROUND = 'space-around'
export const JUSTIFY_SPACE_EVENLY = 'space-evenly'
export const JUSTIFY_STRETCH = 'stretch'

export const DIRECTION_ROW = 'row'
export const DIRECTION_ROW_REVERSE = 'row-reverse'
export const DIRECTION_COLUMN = 'column'
export const DIRECTION_COLUMN_REVERSE = 'column-reverse'

export const WRAP = 'wrap'
export const NO_WRAP = 'nowrap'
export const WRAP_REVERSE = 'wrap-reverse'

// style props are string type for flexibility, but try to use the constants
// defined above for safety
export type FlexProps = {|
  ...StyleProps.ColorProps,
  ...StyleProps.SpacingProps,
  ...StyleProps.TypographyProps,
  alignItems?: string,
  justifyContent?: string,
  direction?: string,
  wrap?: string,
|}

/**
 * Flexbox primitive
 *
 * @component
 */
export const Flex: StyledComponent<
  FlexProps,
  {||},
  HTMLDivElement
> = styled.div`
  display: flex;
  ${StyleProps.colorStyles}
  ${StyleProps.spacingStyles}
  ${StyleProps.typographyStyles}
  ${({ alignItems: ai }) => (ai ? `align-items: ${ai};` : '')}
  ${({ justifyContent: jc }) => (jc ? `justify-content: ${jc};` : '')}
  ${({ direction: d }) => (d ? `flex-direction: ${d};` : '')}
  ${({ wrap }) => (wrap ? `flex-wrap: ${wrap};` : '')}
`
