import styled from '@emotion/styled'

import { isntStyleProp, styleProps } from './style-props'

import type { PrimitiveComponent } from './types'

/**
 * Text primitive
 *
 * @component
 */
export const Text: PrimitiveComponent<'p'> = styled('p', {
  shouldForwardProp: isntStyleProp,
})`
  margin-top: 0;
  margin-bottom: 0;
  ${styleProps}
`
