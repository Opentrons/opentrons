// @flow
import styled from 'styled-components'

import { isntStyleProp, styleProps } from './style-props'
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
