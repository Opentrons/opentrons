import * as React from 'react'
import { getPositionFromSlotId, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import ot2DeckDefV4 from '@opentrons/shared-data/deck/definitions/4/ot2_standard.json'

import { SlotBase } from '../BaseDeck/SlotBase'

import type {
  DeckDefinition,
  DeckSlot,
  RobotType,
} from '@opentrons/shared-data'

interface LegacyDeckSlotLocationProps extends React.SVGProps<SVGGElement> {
  robotType: RobotType
  slotName: DeckSlot['id']
  slotBaseColor?: React.SVGProps<SVGPathElement>['fill']
  slotClipColor?: React.SVGProps<SVGPathElement>['stroke']
}

/**
 * This is a legacy component for rendering an OT-2 deck slot by reference to the V4 deck definition
 */
export function LegacyDeckSlotLocation(
  props: LegacyDeckSlotLocationProps
): JSX.Element | null {
  const {
    robotType,
    slotName,
    slotBaseColor,
    slotClipColor,
    ...restProps
  } = props

  if (robotType !== OT2_ROBOT_TYPE) return null

  const slotDef = ot2DeckDefV4.locations.addressableAreas.find(
    s => s.id === slotName
  )
  if (slotDef == null) {
    console.warn(
      `cannot render DeckSlotLocation, no deck slot named: ${slotName} in OT-2 deck definition`
    )
    return null
  }

  const slotPosition = getPositionFromSlotId(
    slotName,
    (ot2DeckDefV4 as unknown) as DeckDefinition
  )

  const [xPosition, yPosition] = slotPosition ?? [0, 0]
  const { xDimension, yDimension } = slotDef.boundingBox

  const isFixedTrash = slotName === 'fixedTrash'

  // adjust the fixed trash position and dimension
  const fixedTrashPositionAdjustment = isFixedTrash ? 7 : 0
  const fixedTrashDimensionAdjustment = isFixedTrash ? -9 : 0

  const adjustedXPosition = xPosition + fixedTrashPositionAdjustment
  const adjustedYPosition = yPosition + fixedTrashPositionAdjustment
  const adjustedXDimension = xDimension + fixedTrashDimensionAdjustment
  const adjustedYDimension = yDimension + fixedTrashDimensionAdjustment

  return (
    <g {...restProps}>
      <SlotBase
        fill={slotBaseColor}
        d={`M${adjustedXPosition},${adjustedYPosition}h${adjustedXDimension}v${adjustedYDimension}h${-adjustedXDimension}v${-adjustedYDimension}z`}
      />
    </g>
  )
}
