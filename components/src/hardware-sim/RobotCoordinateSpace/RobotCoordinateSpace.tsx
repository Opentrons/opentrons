import { animated } from '@react-spring/web'
import styled from 'styled-components'

import { Svg } from '../../primitives'

import type { ComponentProps } from 'react'

interface RobotCoordinateSpaceProps extends ComponentProps<typeof Svg> {
  animated?: boolean
}
// TODO BEFORE MERGE: What is the difference between RobotWorkSpace and RobotCoordinateSpace these days?
// Do we still need them both? Also why does it seem like RobotWorkSpace is doing more math?
export function RobotCoordinateSpace(
  props: RobotCoordinateSpaceProps
): JSX.Element {
  const { animated = false, children, ...restProps } = props
  const allPassThroughProps = {
    transform: 'scale(1, -1)',
    ...restProps,
  }
  return animated ? (
    <AnimatedSvg {...allPassThroughProps}>{children}</AnimatedSvg>
  ) : (
    <Svg {...allPassThroughProps}>{children}</Svg>
  )
}

/**
 * These animated components needs to be split out because react-spring and styled-components don't play nice
 * @see https://github.com/pmndrs/react-spring/issues/1515 */
// @ts-expect-error Type instantiation is excessively deep and possibly infinite
const AnimatedSvg = styled(animated.svg)<typeof animated.svg>``
