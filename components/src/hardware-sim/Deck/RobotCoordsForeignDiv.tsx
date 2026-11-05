import { withStyleProps } from '../../hocs/withStyleProps'

import type { HTMLAttributes, ReactNode } from 'react'
import type { StyleProps } from '../../primitives'

export type PositionType = 'absolute' | 'relative' | 'fixed'
export interface RobotCoordsForeignDivProps {
  width?: string | number
  height?: string | number
  x?: string | number
  y?: string | number
  children?: ReactNode
  outerProps?: any
  innerDivProps?: StyleProps
  innerDivEvents?: HTMLAttributes<HTMLDivElement>
  transformWithSVG?: boolean
  extraTransform?: string
  dataTestId?: string
}

const StyledDiv = withStyleProps('div' as any)

export const RobotCoordsForeignDiv = ({
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
  innerDivEvents,
}: RobotCoordsForeignDivProps): ReactNode => {
  const svgTransform = `scale(1, -1) ${extraTransform}`

  return (
    <foreignObject
      data-testid={dataTestId}
      x={x}
      y={y}
      height={height}
      width={width}
      transform={transformWithSVG ? svgTransform : extraTransform}
      {...outerProps}
    >
      <StyledDiv
        {...innerDivEvents}
        style={{
          ...innerDivProps,
          ...(transformWithSVG ? { transform: svgTransform } : {}),
        }}
      >
        {children}
      </StyledDiv>
    </foreignObject>
  )
}
