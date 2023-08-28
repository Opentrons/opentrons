import * as React from 'react'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { Flex, Text } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_COLUMN, JUSTIFY_CENTER } from '../../styles'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import type { RobotType } from '@opentrons/shared-data'
interface SlotLabelsProps {
  robotType: RobotType
  color?: string
}

/**
 * Component to render Opentrons Flex slot labels
 * For use as a RobotWorkspace child component
 */
export const SlotLabels = ({
  robotType,
  color,
}: SlotLabelsProps): JSX.Element | null => {
  return robotType === FLEX_ROBOT_TYPE ? (
    <>
      <RobotCoordsForeignObject
        width="2.5rem"
        height="26.75rem"
        x="-147"
        y="-10"
      >
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          height="100%"
          width="2.5rem"
        >
          <Flex alignItems={ALIGN_CENTER} flex="1">
            <Text color={color} as="h3">
              A
            </Text>
          </Flex>
          <Flex alignItems={ALIGN_CENTER} flex="1">
            <Text color={color} as="h3">
              B
            </Text>
          </Flex>
          <Flex alignItems={ALIGN_CENTER} flex="1">
            <Text color={color} as="h3">
              C
            </Text>
          </Flex>
          <Flex alignItems={ALIGN_CENTER} flex="1">
            <Text color={color} as="h3">
              D
            </Text>
          </Flex>
        </Flex>
      </RobotCoordsForeignObject>
      <RobotCoordsForeignObject
        height="2.5rem"
        width="30.375rem"
        x="-15"
        y="-55"
      >
        <Flex
          alignItems={ALIGN_CENTER}
          flex="1"
          width="30.375rem"
          height="2.5rem"
        >
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            flex="1"
          >
            <Text color={color} as="h3">
              1
            </Text>
          </Flex>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            flex="1"
          >
            <Text color={color} as="h3">
              2
            </Text>
          </Flex>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            flex="1"
          >
            <Text color={color} as="h3">
              3
            </Text>
          </Flex>
        </Flex>
      </RobotCoordsForeignObject>
    </>
  ) : null
}
