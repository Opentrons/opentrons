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
 *
 * @deprecated Layout/style primitives are deprecated. If there is a preexisting
 *   higher-level component that does what you want (e.g. from the Helix design system,
 *   or from your project's shared components), use that instead. If not, implement your
 *   own layout+styling with CSS modules and the semantically appropriate native HTML
 *   element (`<li>`, `<menu>`, `<p>`, `<div>`, etc).
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
