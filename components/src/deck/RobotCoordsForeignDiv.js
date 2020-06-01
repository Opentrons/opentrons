// @flow
import * as React from 'react'

export type RobotCoordsForeignDivProps = {|
  width?: string | number,
  height?: string | number,
  x?: string | number,
  y?: string | number,
  children?: React.Node,
  className?: string,
  innerDivProps?: React.ElementProps<'div'>,
  transformWithSVG?: boolean,
|}

export const RobotCoordsForeignDiv = (
  props: RobotCoordsForeignDivProps
): React.Node => {
  const {
    children,
    x = 0,
    y = 0,
    height = '100%',
    width = '100%',
    className,
    innerDivProps,
    transformWithSVG = false,
  } = props

  return (
    <foreignObject
      {...{ x, y, height, width, className }}
      transform={transformWithSVG ? 'scale(1, -1)' : null}
    >
      <div
        {...innerDivProps}
        style={{
          transform: transformWithSVG ? 'none' : 'scale(1, -1)',
        }}
        xmlns="http://www.w3.org/1999/xhtml"
      >
        {children}
      </div>
    </foreignObject>
  )
}
