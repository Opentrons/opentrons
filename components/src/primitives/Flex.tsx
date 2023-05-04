import { styleProps, isntStyleProp } from './style-props'
import type { PrimitiveComponent } from './types'
import styled from 'styled-components'

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
