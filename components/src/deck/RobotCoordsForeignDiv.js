// @flow
import * as React from 'react'

type Props = {
  width?: string | number,
  height?: string | number,
  x?: string | number,
  y?: string | number,
  children?: React.Node,
  className?: string,
  innerDivProps?: React.ElementProps<'div'>,
  transformWithSVG: boolean,
}

const RobotCoordsForeignDiv = (props: Props) => {
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
      transform={transformWithSVG ? 'scale(1, -1)' : 'none'}
    >
      <div
        style={{
          transform: transformWithSVG ? 'none' : 'scale(1, -1)',
        }}
        xmlns="http://www.w3.org/1999/xhtml"
        {...innerDivProps}
      >
        {children}
      </div>
    </foreignObject>
  )
}

export default RobotCoordsForeignDiv
