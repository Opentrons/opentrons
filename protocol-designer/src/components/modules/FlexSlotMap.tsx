import * as React from 'react'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordinateSpace,
  RobotCoordsForeignObject,
  SingleSlotFixture,
  SPACING,
} from '@opentrons/components'

import type { Cutout } from '@opentrons/shared-data'

const X_ADJUSTMENT_LEFT_SIDE = -101.5
const X_ADJUSTMENT = -17
const X_DIMENSION_MIDDLE_SLOTS = 160.3
const X_DIMENSION_OUTER_SLOTS = 246.5
const Y_DIMENSION = 106.0

interface FlexSlotMapProps {
  selectedSlots: string[]
}
export function FlexSlotMap(props: FlexSlotMapProps): JSX.Element {
  const { selectedSlots } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const slotFill = (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey2}
      borderRadius={BORDERS.radiusSoftCorners}
      color={COLORS.white}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
    />
  )

  return (
    <RobotCoordinateSpace
      height="100px"
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {deckDef.locations.cutouts.map(cutout => (
        <SingleSlotFixture
          key={cutout.id}
          cutoutId={cutout.id as Cutout}
          deckDefinition={deckDef}
          slotClipColor={COLORS.transparent}
          fixtureBaseColor={COLORS.light1}
        />
      ))}
      {selectedSlots.map((selectedSlot, index) => {
        // if selected slot is passed as a cutout id, trim to define as slot id
        const slotFromCutout = selectedSlot.replace('cutout', '')
        const [xSlotPosition = 0, ySlotPosition = 0] =
          getPositionFromSlotId(slotFromCutout, deckDef) ?? []

        const isLeftSideofDeck =
          selectedSlot === 'A1' ||
          selectedSlot === 'B1' ||
          selectedSlot === 'C1' ||
          selectedSlot === 'D1'
        const xAdjustment = isLeftSideofDeck
          ? X_ADJUSTMENT_LEFT_SIDE
          : X_ADJUSTMENT
        const x = xSlotPosition + xAdjustment
        const yAdjustment = -10
        const y = ySlotPosition + yAdjustment

        const isMiddleOfDeck =
          selectedSlot === 'A2' ||
          selectedSlot === 'B2' ||
          selectedSlot === 'C2' ||
          selectedSlot === 'D2'

        const xDimension = isMiddleOfDeck
          ? X_DIMENSION_MIDDLE_SLOTS
          : X_DIMENSION_OUTER_SLOTS
        const yDimension = Y_DIMENSION

        return (
          <RobotCoordsForeignObject
            key={`${selectedSlot}_${index}`}
            width={xDimension}
            height={yDimension}
            x={x}
            y={y}
            flexProps={{ flex: '1' }}
            foreignObjectProps={{ flex: '1' }}
          >
            {slotFill}
          </RobotCoordsForeignObject>
        )
      })}
    </RobotCoordinateSpace>
  )
}
