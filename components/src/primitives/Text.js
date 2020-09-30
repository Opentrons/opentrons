// @flow
import styled from 'styled-components'

import { styleProps, isntStyleProp } from './style-props'

import type { PrimitiveComponent } from './types'

// TODO(mc, 2020-05-08): add variants (--font-body-2-dark, etc) as variant prop
// or as components that compose the base Text component

/**
 * Text primitive
 *
 * @component
 */
export const Text: PrimitiveComponent<HTMLParagraphElement> = styled.p.withConfig(
  { shouldForwardProp: isntStyleProp }
)`
  margin-top: 0;
  margin-bottom: 0;
  ${styleProps}
`
