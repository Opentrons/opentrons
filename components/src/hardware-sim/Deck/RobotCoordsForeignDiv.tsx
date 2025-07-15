import type { ReactNode } from 'react'

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
    display?: 'flex'
    justifyContent?: string
    alignItems?: string
    padding?: string
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
    innerDivProps,
    transformWithSVG = false,
    extraTransform = '',
    dataTestId = '',
  } = props

  const transform = `scale(1, -1) ${extraTransform}`
  return (
    <foreignObject
      data-testid={dataTestId}
      {...{ x, y, height, width, ...outerProps }}
      transform={transformWithSVG ? transform : extraTransform}
    >
      <div
        // xmlns="http://www.w3.org/1999/xhtml"
        style={{
          ...innerDivProps,
          ...(transformWithSVG ? { transform } : {}),
        }}
      >
        {children}
      </div>
    </foreignObject>
  )
}
