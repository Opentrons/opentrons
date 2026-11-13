import type { ComponentProps, ReactNode } from 'react'

export interface RobotCoordsTextProps extends ComponentProps<'text'> {
  x: number
  /** The y-coordinate of the text baseline, in the Opentrons robot orientation, so +y is towards the top of the screen. */
  y: number
  children?: ReactNode
  canHighlight?: boolean
}

/**
 * SVG text positioned with Opentrons robot coordinates.
 *
 * This should be used inside a wrapper like RobotWorkSpace that sets up a transformation
 * to orient the SVG with the Opentrons coordinate convention, with +y towards the
 * top of the screen.
 *
 * This component surgically undoes the wrapper's transformation so the child text is
 * displayed right-side-up.
 */
export function RobotCoordsText(props: RobotCoordsTextProps): ReactNode {
  const { x, y, children, canHighlight = true, ...additionalProps } = props
  return (
    <text
      {...additionalProps}
      x={x}
      y={-1 * y}
      transform="scale(1, -1)"
      style={{ userSelect: !canHighlight ? 'none' : undefined }}
    >
      {children}
    </text>
  )
}
