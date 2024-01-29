import * as React from 'react'
import { Box } from '../../primitives'

export interface RobotCoordsForeignDivProps {
  width?: string | number
  height?: string | number
  x?: string | number
  y?: string | number
  children?: React.ReactNode
  outerProps?: any
  innerDivProps?: React.ComponentProps<typeof Box>
  transformWithSVG?: boolean
  extraTransform?: string
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
  } = props

  const transform = `scale(1, -1) ${extraTransform}`
  return (
    <foreignObject
      {...{ x, y, height, width, ...outerProps }}
      transform={transformWithSVG ? transform : extraTransform}
    >
      <Box
        style={transformWithSVG ? {} : { transform }}
        xmlns="http://www.w3.org/1999/xhtml"
        {...innerDivProps}
      >
        {children}
      </Box>
    </foreignObject>
  )
}
