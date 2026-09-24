import {
  ALIGN_CENTER,
  C_MED_LIGHT_GRAY,
  JUSTIFY_CENTER,
  RobotCoordsForeignDiv,
  SPACING_1,
} from '../../'

import type { ReactNode } from 'react'

export interface ModuleTagProps {
  x: number
  y: number
  height: number
  width: number
  children: ReactNode
}

export const ModuleTag = (props: ModuleTagProps): ReactNode => {
  const { x, y, height, width, children } = props

  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y}
      height={height}
      width={width}
      innerDivProps={{
        display: 'flex',
        justifyContent: JUSTIFY_CENTER,
        alignItems: ALIGN_CENTER,
        backgroundColor: C_MED_LIGHT_GRAY,
        padding: SPACING_1,
      }}
    >
      {children}
    </RobotCoordsForeignDiv>
  )
}
