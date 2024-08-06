import * as React from 'react'

import {
  LegacyStyledText,
  RobotCoordsForeignObject,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import type { RobotType } from '@opentrons/shared-data'

interface SlotDetailContainerProps {
  robotType: RobotType
}

export const SlotDetailsContainer = (
  props: SlotDetailContainerProps
): JSX.Element | null => {
  const { robotType } = props
  return (
    <RobotCoordsForeignObject
      width="5rem"
      height="26.75rem"
      x={robotType === FLEX_ROBOT_TYPE ? '-180' : '-110'}
      y="-10"
    >
      <LegacyStyledText as="p">Slot information</LegacyStyledText>
    </RobotCoordsForeignObject>
  )
}
