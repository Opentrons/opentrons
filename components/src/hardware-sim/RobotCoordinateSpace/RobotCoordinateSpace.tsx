import { animated } from '@react-spring/web'

import styles from './robotcoordinatespace.module.css'

import type { ComponentType, ReactNode } from 'react'

interface RobotCoordinateSpaceProps {
  animated?: boolean
  children?: ReactNode
  height?: string
  viewBox?: string
}

const AnimatedSvg = animated.svg as ComponentType<any>

export function RobotCoordinateSpace(
  props: RobotCoordinateSpaceProps
): JSX.Element {
  const { animated: isAnimated = false, children, ...restProps } = props

  const allPassThroughProps = {
    className: styles.svg,
    ...restProps,
  }

  return isAnimated ? (
    <AnimatedSvg {...allPassThroughProps}>{children}</AnimatedSvg>
  ) : (
    <svg {...allPassThroughProps}>{children}</svg>
  )
}
