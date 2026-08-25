import { RobotInfoLabel } from '../../molecules/RobotInfoLabel'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'

import type { ReactNode } from 'react'

export function StackedBadge(): ReactNode {
  return (
    <RobotCoordsForeignObject height="2.5rem" width="2.5rem" x={113} y={53}>
      <RobotInfoLabel
        height="1.25rem"
        svgSize="0.875rem"
        highlight
        iconName="stacked"
      />
    </RobotCoordsForeignObject>
  )
}
