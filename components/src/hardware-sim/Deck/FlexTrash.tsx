import * as React from 'react'

import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { Icon } from '../../icons'
import { Flex, Text } from '../../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from './RobotCoordsForeignObject'

import trashDef from '@opentrons/shared-data/labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

import type { RobotType } from '@opentrons/shared-data'

// only allow edge cutout locations (columns 1 and 3)
export type TrashCutoutId =
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
  trashCutoutId?: TrashCutoutId
}

/**
 * Component to render Opentrons Flex trash
 * For use as a RobotWorkspace child component
 */
export const FlexTrash = ({
  robotType,
  trashIconColor,
  backgroundColor,
  trashCutoutId,
}: FlexTrashProps): JSX.Element | null => {
  // be sure we don't try to render for an OT-2
  if (robotType !== FLEX_ROBOT_TYPE) return null

  const deckDefinition = getDeckDefFromRobotType(robotType)

  const trashCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === trashCutoutId
  )

  // retrieve slot x,y positions and dimensions from deck definition for the given trash cutout location
  const [x = 0, y = 0] = trashCutout?.position ?? []

  // a standard addressable area slot bounding box dimension
  const {
    xDimension: slotXDimension = 0,
    yDimension: slotYDimension = 0,
  } = deckDefinition.locations.addressableAreas[0].boundingBox

  // adjust for dimensions from trash definition
  const { x: xAdjustment, y: yAdjustment } = trashDef.cornerOffsetFromSlot
  const { xDimension, yDimension } = trashDef.dimensions

  // rotate trash 180 degrees in column 1
  const rotateDegrees =
    trashCutoutId === 'cutoutA1' ||
    trashCutoutId === 'cutoutB1' ||
    trashCutoutId === 'cutoutC1' ||
    trashCutoutId === 'cutoutD1'
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
          gridGap={SPACING.spacing8}
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
            height="2rem"
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
