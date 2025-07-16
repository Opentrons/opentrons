import type { ReactElement, ReactNode } from 'react'

export interface ForeignObjectProps {
  width: string | number
  height: string | number
  x: string | number
  y: string | number
  children?: ReactNode
}

/**
 * Foreign Object styled atomic component
 *
 * @component
 */

export const ForeignObject = ({
  width,
  height,
  x,
  y,
  children,
}: ForeignObjectProps): ReactElement => {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      {children}
    </foreignObject>
  )
}
