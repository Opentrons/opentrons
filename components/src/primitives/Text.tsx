import styled from 'styled-components'

import { styleProps, isntStyleProp } from './style-props'

import type { PrimitiveComponent } from './types'

/**
 * Text primitive
 *
 * @component
 */
export const Text: PrimitiveComponent<'p'> = styled.p.withConfig({
  shouldForwardProp: isntStyleProp,
})`
  margin-top: 0;
  margin-bottom: 0;
  ${styleProps}
`
