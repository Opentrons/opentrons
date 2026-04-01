import { COLORS } from '@opentrons/components'
import {
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
} from '@opentrons/shared-data'

import { getSlotIsEmpty } from '../utils/getSlotIsEmpty'
import { getStagingAreaAddressableAreas } from '../utils/getStagingAreaAddressableAreas'
import { DeckViewOverlay } from './DeckViewOverlay'

import type { Dispatch, SetStateAction } from 'react'
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
  robotState: RobotState
  invariantContext: InvariantContext
  stagingAreaCutoutIds: CutoutId[]
  slotIdsBlockedBySpanning: string[]
}

export function DeckViewSlots(props: DeckViewSlotsProps): JSX.Element {
  const {
    deckDef,
    robotType,
    setSelectedSlot,
    setHoveredSlot,
    hoveredSlot,
    robotState,
    invariantContext,
    stagingAreaCutoutIds,
    slotIdsBlockedBySpanning,
  } = props
  return (
    <>
      {deckDef.locations.addressableAreas.reduce<JSX.Element[]>(
        (acc, addressableArea) => {
          const stagingAreaAddressableAreas =
            getStagingAreaAddressableAreas(stagingAreaCutoutIds)
          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
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
