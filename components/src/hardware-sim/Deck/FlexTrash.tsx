import * as React from 'react'

import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { Icon } from '../../icons'
import { Flex, Text } from '../../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import trashDef from '@opentrons/shared-data/labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

import type { RobotType } from '@opentrons/shared-data'

// only allow edge cutout locations (columns 1 and 3)
export type TrashLocation =
  | 'cutoutA1'
  | 'cutoutB1'
  | 'cutoutC1'
  | 'cutoutD1'
  | 'cutoutA3'
  | 'cutoutB3'
  | 'cutoutC3'
  | 'cutoutD3'

interface FlexTrashProps {
  robotType: RobotType
  trashIconColor: string
  backgroundColor: string
  trashLocation?: TrashLocation
}

/**
 * Component to render Opentrons Flex trash
 * For use as a RobotWorkspace child component
 */
export const FlexTrash = ({
  robotType,
  trashIconColor,
  backgroundColor,
  trashLocation,
}: FlexTrashProps): JSX.Element | null => {
  // be sure we don't try to render for an OT-2
  if (robotType !== FLEX_ROBOT_TYPE) return null

  const deckDefinition = getDeckDefFromRobotType(robotType)

  const trashSlot = deckDefinition.locations.cutouts.find(
    slot => slot.id === trashLocation
  )

  // retrieve slot x,y positions and dimensions from deck definition for the given trash slot
  // TODO(bh, 2023-10-09): refactor position, offsets, and rotation after v4 migration
  const [x = 0, y = 0] = trashSlot?.position ?? []
  const [slotXDimension = 0, slotYDimension = 0] = trashSlot?.position ?? []

  // adjust for dimensions from trash definition
  const { x: xAdjustment, y: yAdjustment } = trashDef.cornerOffsetFromSlot
  const { xDimension, yDimension } = trashDef.dimensions

  // rotate trash 180 degrees in column 1
  const rotateDegrees =
    trashLocation === 'cutoutA1' ||
    trashLocation === 'cutoutB1' ||
    trashLocation === 'cutoutC1' ||
    trashLocation === 'cutoutD1'
      ? '180'
      : '0'

  // rotate trash around x,y midpoint of standard slot bounding box
  const rotateXCoord = x + slotXDimension / 2
  const rotateYCoord = y + slotYDimension / 2

  return x != null && y != null && xDimension != null && yDimension != null ? (
    <g transform={`rotate(${rotateDegrees}, ${rotateXCoord}, ${rotateYCoord})`}>
      <RobotCoordsForeignObject
        width={xDimension}
        height={yDimension}
        x={x + xAdjustment}
        y={y + yAdjustment}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{ flex: '1' }}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          backgroundColor={backgroundColor}
          borderRadius={BORDERS.radiusSoftCorners}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
        >
          {rotateDegrees === '180' ? (
            <Text
              color={trashIconColor}
              // rotate text back 180 degrees
              transform={`rotate(${rotateDegrees}deg)`}
              transformOrigin="center"
              css={TYPOGRAPHY.bodyTextSemiBold}
            >
              Trash bin
            </Text>
          ) : null}
          <Icon
            name="trash"
            color={trashIconColor}
            height="3.5rem"
            // rotate icon back 180 degrees
            transform={`rotate(${rotateDegrees}deg)`}
            transformOrigin="center"
          />
          {rotateDegrees === '0' ? (
            <Text color={trashIconColor} css={TYPOGRAPHY.bodyTextSemiBold}>
              Trash bin
            </Text>
          ) : null}
        </Flex>
      </RobotCoordsForeignObject>
    </g>
  ) : null
}
