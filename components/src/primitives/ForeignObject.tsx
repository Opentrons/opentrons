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
  ...rest
}: ForeignObjectProps): ReactElement => {
  return (
    <foreignObject
      {...rest} // forwards things like x, y, etc.
    />
  )
}
