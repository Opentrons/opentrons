import styled from '@emotion/styled'

import { isntStyleProp, styleProps } from './style-props'

import type { PrimitiveComponent } from './types'

/**
 * Flex primitive
 *
 * @component
 */
export const Flex: PrimitiveComponent<'div'> = styled('div', {
  shouldForwardProp: isntStyleProp,
})`
  display: flex;
  ${styleProps}
`
