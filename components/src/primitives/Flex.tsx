// import styled from 'styled-components'

import { withStyleProps } from '../hocs/withStyleProps'

// import { isntStyleProp, styleProps } from './style-props'

import type { ComponentProps } from 'react'

// import type { PrimitiveComponent } from './types'

/**
 * Flex primitive
 *
 * @component
 */
// export const Flex: PrimitiveComponent<'div'> = styled.div.withConfig({
//   shouldForwardProp: isntStyleProp,
// })`
//   display: flex;
//   ${styleProps}
// `
// const FlexComponent = (props: ComponentProps<'div'>): JSX.Element => (
//   <div {...props} style={{ display: 'flex', ...props.style }} />
// )

const FlexComponent = (props: ComponentProps<'div'>): JSX.Element => (
  <div {...props} style={{ display: 'flex', ...props.style }} />
)

export const Flex = withStyleProps(FlexComponent)
