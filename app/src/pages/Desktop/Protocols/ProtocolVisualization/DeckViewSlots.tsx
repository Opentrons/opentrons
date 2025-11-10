import { Fragment } from 'react'

import { COLORS } from '@opentrons/components'
import {
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
} from '@opentrons/shared-data'

import { DeckViewOverlay } from './DeckViewOverlay'
import { getSlotIsEmpty, getStagingAreaAddressableAreas } from './utils'

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
      {deckDef.locations.addressableAreas
        .filter(addressableArea => {
          const stagingAreaAddressableAreas =
            getStagingAreaAddressableAreas(stagingAreaCutoutIds)

          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
          return (
            addressableArea.id === 'fixedTrash' ||
            (addressableAreas &&
              !slotIdsBlockedBySpanning.includes(addressableArea.id) &&
              getSlotIsEmpty(robotState, addressableArea.id))
          )
        })
        .map(addressableArea => {
          const slotPosition = getPositionFromSlotId(
            addressableArea.id,
            deckDef
          )
          return (
            <Fragment key={addressableArea.id}>
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
              />
            </Fragment>
          )
        })}
    </>
  )
}
