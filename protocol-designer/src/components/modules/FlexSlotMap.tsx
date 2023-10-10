import * as React from 'react'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  ModuleType,
  THERMOCYCLER_MODULE_TYPE,
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

interface FlexSlotMapProps {
  selectedSlots: string[]
  //    need to special case the TC GEN2 to select 2 slots
  moduleType?: ModuleType
}
export function FlexSlotMap(props: FlexSlotMapProps): JSX.Element {
  const { moduleType, selectedSlots } = props
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
        <>
          <DeckSlotLocation
            slotName={slotDef.id}
            deckDefinition={deckDef}
            slotClipColor={COLORS.transparent}
            slotBaseColor={COLORS.light1}
          />
        </>
      ))}
      {selectedSlots.map(selectedSlot => {
        const slot = deckDef.locations.orderedSlots.find(
          slot => slot.id === selectedSlot
        )
        const aOneSlot = deckDef.locations.orderedSlots.find(
          slot => slot.id === 'A1'
        )
        const [xSlotPosition = 0, ySlotPosition = 0] = slot?.position ?? []
        const [xSlotPosition2 = 0, ySlotPosition2 = 0] =
          aOneSlot?.position ?? []

        const isLeftSideofDeck =
          selectedSlot === 'A1' ||
          selectedSlot === 'B1' ||
          selectedSlot === 'C1' ||
          selectedSlot === 'D1'
        const xAdjustment = isLeftSideofDeck ? -101.5 : -17
        const x = xSlotPosition + xAdjustment
        const yAdjustment = -10
        const y = ySlotPosition + yAdjustment

        const isMiddleOfDeck =
          selectedSlot === 'A2' ||
          selectedSlot === 'B2' ||
          selectedSlot === 'C2' ||
          selectedSlot === 'D2'

        const xDimension = isMiddleOfDeck ? 160.3 : 246.5
        const yDimension = 106.0

        return (
          <>
            <RobotCoordsForeignObject
              width={xDimension}
              height={yDimension}
              x={x}
              y={y}
              flexProps={{ flex: '1' }}
              foreignObjectProps={{ flex: '1' }}
            >
              {slotFill}
            </RobotCoordsForeignObject>
            {moduleType === THERMOCYCLER_MODULE_TYPE ? (
              <RobotCoordsForeignObject
                width={xDimension}
                height={yDimension}
                x={xAdjustment}
                y={ySlotPosition2 + yAdjustment}
                flexProps={{ flex: '1' }}
                foreignObjectProps={{ flex: '1' }}
              >
                {slotFill}
              </RobotCoordsForeignObject>
            ) : null}
          </>
        )
      })}
    </RobotCoordinateSpace>
  )
}
