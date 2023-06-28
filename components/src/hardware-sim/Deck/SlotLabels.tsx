import * as React from 'react'

import { LocationIcon } from '../../molecules'
import { Flex } from '../../primitives'
import { DIRECTION_COLUMN } from '../../styles'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import type { RobotType } from '@opentrons/shared-data'

interface SlotLabelsProps {
  robotType: RobotType
}

/**
 * Component to render Opentrons Flex slot labels
 * For use as a RobotWorkspace child component
 */
export const SlotLabels = ({
  robotType,
}: SlotLabelsProps): JSX.Element | null => {
  return robotType === 'OT-3 Standard' ? (
    <>
      <RobotCoordsForeignObject
        width="2.5rem"
        height="26.75rem"
        x="-147"
        y="-10"
      >
        <Flex
          alignItems="center"
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          height="100%"
          width="2.5rem"
        >
          <Flex alignItems="center" flex="1">
            <LocationIcon slotName="A" height="max-content" width="100%" />
          </Flex>
          <Flex alignItems="center" flex="1">
            <LocationIcon slotName="B" height="max-content" width="100%" />
          </Flex>
          <Flex alignItems="center" flex="1">
            <LocationIcon slotName="C" height="max-content" width="100%" />
          </Flex>
          <Flex alignItems="center" flex="1">
            <LocationIcon slotName="D" height="max-content" width="100%" />
          </Flex>
        </Flex>
      </RobotCoordsForeignObject>
      <RobotCoordsForeignObject
        height="2.5rem"
        width="30.375rem"
        x="-15"
        y="-55"
      >
        <Flex alignItems="center" flex="1" width="30.375rem" height="2.5rem">
          <Flex alignItems="center" justifyContent="center" flex="1">
            <LocationIcon slotName="1" height="100%" width="" />
          </Flex>
          <Flex alignItems="center" justifyContent="center" flex="1">
            <LocationIcon slotName="2" height="100%" width="" />
          </Flex>
          <Flex alignItems="center" justifyContent="center" flex="1">
            <LocationIcon slotName="3" height="100%" width="" />
          </Flex>
        </Flex>
      </RobotCoordsForeignObject>
    </>
  ) : null
}
