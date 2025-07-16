import type { ReactNode } from 'react'
import type { FlexDirection } from '../../hardware-sim/Deck/RobotCoordsForeignObject'

export type PositionType = 'absolute' | 'relative' | 'fixed'
export interface RobotCoordsForeignDivProps {
  width?: string | number
  height?: string | number
  x?: string | number
  y?: string | number
  children?: ReactNode
  outerProps?: any
  innerDivProps?: {
    borderRadius?: string
    backgroundColor?: string
    border?: string
    width?: string
    height?: string
    display?: string
    justifyContent?: string
    alignItems?: string
    padding?: string
    transform?: string
    overflow?: string
    maxWidth?: string
    maxHeight?: string
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onClick?: () => void
    opacity?: string | number
    zIndex?: string | number
    cursor?: string
    position?: PositionType
    top?: number
    right?: number
    bottom?: number
    left?: number
    color?: string
    fontSize?: string
    className?: string
    flexDirection?: FlexDirection
  }
  transformWithSVG?: boolean
  extraTransform?: string
  /** optional data-testid to test foreignObjects in cypress */
  dataTestId?: string
}

export const RobotCoordsForeignDiv = (
  props: RobotCoordsForeignDivProps
): JSX.Element => {
  const {
    children,
    x = 0,
    y = 0,
    height = '100%',
    width = '100%',
    outerProps,
    innerDivProps = {},
    transformWithSVG = false,
    extraTransform = '',
    dataTestId = '',
  } = props

  const transform = `scale(1, -1) ${extraTransform}`
  const {
    onMouseEnter,
    onMouseLeave,
    onClick,
    className,
    ...restInnerDivProps
  } = innerDivProps
  return (
    <foreignObject
      data-testid={dataTestId}
      {...{ x, y, height, width, ...outerProps }}
      transform={transformWithSVG ? transform : extraTransform}
    >
      <div
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        // xmlns="http://www.w3.org/1999/xhtml"
        style={{
          ...restInnerDivProps,
          ...(transformWithSVG ? { transform } : {}),
        }}
      >
        {children}
      </div>
    </foreignObject>
  )
}
