import * as React from 'react'
import { Svg } from '../../primitives'

export function RobotCoordinateSpace(
  props: React.ComponentProps<typeof Svg>
): JSX.Element {
  const { children, ...restProps } = props
  return (
    <Svg transform="scale(1, -1)" {...restProps}>
      {children}
    </Svg>
  )
}
