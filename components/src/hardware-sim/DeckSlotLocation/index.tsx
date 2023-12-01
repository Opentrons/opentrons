import * as React from 'react'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import ot2DeckDefV3 from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { SlotBase } from '../BaseDeck/SlotBase'

import type { DeckSlot, RobotType } from '@opentrons/shared-data'

interface LegacyDeckSlotLocationProps extends React.SVGProps<SVGGElement> {
  robotType: RobotType
  slotName: DeckSlot['id']
  slotBaseColor?: React.SVGProps<SVGPathElement>['fill']
  slotClipColor?: React.SVGProps<SVGPathElement>['stroke']
}

/**
 * This is a legacy component for rendering an OT-2 deck slot by reference to the V3 deck definition
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

  const slotDef = ot2DeckDefV3.locations.orderedSlots.find(
    s => s.id === slotName
  )
  if (slotDef == null) {
    console.warn(
      `cannot render DeckSlotLocation, no deck slot named: ${slotName} in OT-2 deck definition`
    )
    return null
  }

  const [xPosition, yPosition] = slotDef.position
  const { xDimension, yDimension } = slotDef.boundingBox

  return (
    <g {...restProps}>
      <SlotBase
        fill={slotBaseColor}
        d={`M${xPosition},${yPosition}h${xDimension}v${yDimension}h${-xDimension}v${-yDimension}z`}
      />
    </g>
  )
}
