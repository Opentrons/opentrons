import * as React from 'react'

export interface RobotCoordsTextProps {
  x: number
  y: number
  children?: React.Children
}

/** SVG text reflected to use take robot coordinates as props */
// TODO: Ian 2019-05-07 reconcile this with Brian's version
export function RobotCoordsText(props: RobotCoordsTextProps): JSX.Element {
  const { x, y, children, ...additionalProps } = props
  return (
    <text {...additionalProps} x={x} y={-1 * y} transform="scale(1, -1)">
      {children}
    </text>
  )
}
