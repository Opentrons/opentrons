import * as React from 'react'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'
import { RobotCoordinateSpace } from '@opentrons/components/src/hardware-sim/RobotCoordinateSpace'
import { DeckSlotLocation } from '@opentrons/components/src/hardware-sim/DeckSlotLocation'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignObject,
  SPACING,
} from '@opentrons/components'

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
      {deckDef.locations.orderedSlots.map(slotDef => (
        <DeckSlotLocation
          key={slotDef.id}
          slotName={slotDef.id}
          deckDefinition={deckDef}
          slotClipColor={COLORS.transparent}
          slotBaseColor={COLORS.light1}
        />
      ))}
      {selectedSlots.map((selectedSlot, index) => {
        const slot = deckDef.locations.orderedSlots.find(
          slot => slot.id === selectedSlot
        )
        const [xSlotPosition = 0, ySlotPosition = 0] = slot?.position ?? []

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
            key={`${selectedSlot}_${slot?.id}_${index}`}
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
