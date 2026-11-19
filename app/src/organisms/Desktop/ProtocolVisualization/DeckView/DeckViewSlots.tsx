import { COLORS } from '@opentrons/components'
import {
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { getSlotIsEmpty } from '../utils/getSlotIsEmpty'
import { DeckViewOverlay } from './DeckViewOverlay'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface DeckViewSlotsProps {
  deckDef: DeckDefinition
  robotType: RobotType
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  hoveredSlot: string | null
  selectedSlot: string | null
  robotState: RobotState
  invariantContext: InvariantContext
  stagingAreaCutoutIds: CutoutId[]
  slotIdsBlockedBySpanning: string[]
}

export function DeckViewSlots(props: DeckViewSlotsProps): ReactNode {
  const {
    deckDef,
    robotType,
    setSelectedSlot,
    setHoveredSlot,
    hoveredSlot,
    selectedSlot,
    robotState,
    invariantContext,
    stagingAreaCutoutIds,
    slotIdsBlockedBySpanning,
  } = props
  const isFlex = robotType !== OT2_ROBOT_TYPE
  return (
    <>
      {deckDef.locations.addressableAreas.reduce<JSX.Element[]>(
        (acc, addressableArea) => {
          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            (isFlex &&
              FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(
                addressableArea.id
              ))
          const slotPosition = getPositionFromSlotId(
            addressableArea.id,
            deckDef
          )
          if (
            addressableArea.id === 'fixedTrash' ||
            (addressableAreas &&
              !slotIdsBlockedBySpanning.includes(addressableArea.id) &&
              getSlotIsEmpty(robotState, addressableArea.id))
          ) {
            return [
              ...acc,
              <DeckViewOverlay
                key={`${addressableArea.id}_hoveredSlot_labware`}
                slotId={addressableArea.id}
                slotPosition={slotPosition}
                slotFillColor={COLORS.purple50}
                robotType={robotType}
                invariantContext={invariantContext}
                robotState={robotState}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
                hover={hoveredSlot}
                selectedSlot={selectedSlot}
                stagingAreaCutoutIds={stagingAreaCutoutIds}
              />,
            ]
          }
          return acc
        },
        []
      )}
    </>
  )
}
