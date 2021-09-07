import styled from 'styled-components'

import { styleProps, isntStyleProp } from './style-props'

import type { PrimitiveComponent } from './types'

/**
 * Simple Box atom. Renders a `div` by default and accepts all primitive styling props.
 *
 * @component
 */
export const Box: PrimitiveComponent<'div'> = styled.div.withConfig({
  shouldForwardProp: isntStyleProp,
})`
  min-width: 0;
  ${styleProps}
`
