// @flow
import styled from 'styled-components'

import { styleProps, isntStyleProp } from './style-props'

import type { PrimitiveComponent } from './types'

/**
 * Box primitive
 *
 * @component
 */
export const Box: PrimitiveComponent<HTMLDivElement> = styled.div.withConfig({
  shouldForwardProp: isntStyleProp,
})`
  min-width: 0;
  ${styleProps}
`
