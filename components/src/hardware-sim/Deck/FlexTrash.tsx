import * as React from 'react'

import { Icon } from '../../icons'
import { Btn, Flex } from '../../primitives'
import {
  ALIGN_CENTER,
  DISPLAY_FLEX,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
} from '../../styles'
import { BORDERS, COLORS, SPACING } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import trashDef from '@opentrons/shared-data/labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

import type { RobotType } from '@opentrons/shared-data'

// only allow edge slots (columns 1 and 3)
export type TrashSlotName =
  | 'A1'
  | 'B1'
  | 'C1'
  | 'D1'
  | 'A3'
  | 'B3'
  | 'C3'
  | 'D3'

interface FlexTrashProps {
  robotType: RobotType
  trashIconColor: string
  backgroundColor: string
  handleClickRemove?: (trashSlotName: string) => void
  trashSlotName?: TrashSlotName
}

/**
 * Component to render Opentrons Flex trash
 * For use as a RobotWorkspace child component
 */
export const FlexTrash = ({
  robotType,
  trashIconColor,
  backgroundColor,
  handleClickRemove,
  // default Flex trash slot position A3
  trashSlotName = 'A3',
}: FlexTrashProps): JSX.Element | null => {
  // be sure we don't try to render for an OT-2
  if (robotType !== 'OT-3 Standard') return null

  const deckDef = getDeckDefFromRobotType(robotType)
  const trashSlot = deckDef.locations.orderedSlots.find(
    slot => slot.id === trashSlotName
  )

  // retrieve slot x,y positions and dimensions from deck definition for the given trash slot
  const [x = 0, y = 0] = trashSlot?.position ?? []
  const { xDimension: slotXDimension = 0, yDimension: slotYDimension = 0 } =
    trashSlot?.boundingBox ?? {}

  // adjust for dimensions from trash definition
  const { x: xAdjustment, y: yAdjustment } = trashDef.cornerOffsetFromSlot
  const { xDimension, yDimension } = trashDef.dimensions

  // rotate trash 180 degrees in column 1
  const rotateDegrees =
    trashSlotName === 'A1' ||
    trashSlotName === 'B1' ||
    trashSlotName === 'C1' ||
    trashSlotName === 'D1'
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
          <Icon
            name="trash"
            color={trashIconColor}
            height="3.5rem"
            position={POSITION_RELATIVE}
            // rotate icon back 180 degrees
            transform={`rotate(${rotateDegrees}deg)`}
            transformOrigin="center"
          />
          {handleClickRemove != null ? (
            <Btn
              display={DISPLAY_FLEX}
              justifyContent={JUSTIFY_CENTER}
              left={rotateDegrees === '180' ? SPACING.spacing60 : '9.375rem'}
              position={POSITION_ABSOLUTE}
              onClick={() => handleClickRemove(trashSlotName)}
            >
              <Icon name="remove" color={COLORS.white} height="2.25rem" />
            </Btn>
          ) : null}
        </Flex>
      </RobotCoordsForeignObject>
    </g>
  ) : null
}
