import styled from 'styled-components'

import { isntStyleProp, styleProps } from './style-props'

import type { PrimitiveComponent } from './types'

/**
 * Flex primitive
 *
 * @component
 */
export const Flex: PrimitiveComponent<'div'> = styled.div.withConfig({
  shouldForwardProp: isntStyleProp,
})`
  display: flex;
  ${styleProps}
`
