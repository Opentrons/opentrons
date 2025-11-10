import {
  getAddressableAreaFromSlotId,
  getPositionFromSlotId,
} from '@opentrons/shared-data'

import { POTENTIAL_TRASH_COMMAND_TYPES } from './consants'
import { DeckViewLabware } from './DeckViewLabware'
import { DeckViewModules } from './DeckViewModules'
import { DeckViewSlots } from './DeckViewSlots'
import { FixtureCommandSummary } from './FixtureCommandSummary'
import { getSlotIdsBlockedBySpanningForThermocycler } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CutoutId,
  DeckDefinition,
  Liquid,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { LabwareEntityExtended } from './DeckView'

interface DeckViewDetailsProps {
  labwareEntitiesExtended: Record<string, LabwareEntityExtended>
  liquids: Liquid[]
  robotState: TimelineFrame
  robotType: RobotType
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  stagingAreaCutoutIds: CutoutId[]
  invariantContext: InvariantContext
  deckDef: DeckDefinition
  hoveredSlot: string | null
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  selectedRunTimeCommand?: RunTimeCommand
}
export function DeckViewDetails(props: DeckViewDetailsProps): JSX.Element {
  const {
    robotState,
    robotType,
    deckDef,
    setSelectedSlot,
    stagingAreaCutoutIds,
    invariantContext,
    selectedRunTimeCommand,
    setHoveredSlot,
    hoveredSlot,
    liquids,
    labwareEntitiesExtended,
  } = props
  const { modules } = robotState
  const { moduleEntities, trashBinEntities } = invariantContext
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    modules,
    moduleEntities,
    robotType
  )
  const pipetteCurrentTrashId = Object.values(robotState.pipettes).find(
    pipette =>
      pipette.entityId != null && trashBinEntities[pipette.entityId] != null
  )?.entityId
  const isPipetteOverTrash =
    pipetteCurrentTrashId != null &&
    selectedRunTimeCommand != null &&
    POTENTIAL_TRASH_COMMAND_TYPES.includes(selectedRunTimeCommand.commandType)
  const trashSlotWherePipetteIsOver =
    pipetteCurrentTrashId != null
      ? trashBinEntities[pipetteCurrentTrashId].location
      : null
  const trashAddressableArea =
    trashSlotWherePipetteIsOver != null
      ? getAddressableAreaFromSlotId(
          trashSlotWherePipetteIsOver.split('cutout')[1],
          deckDef
        )
      : null
  return (
    <>
      {/* all modules */}
      <DeckViewModules
        robotState={robotState}
        invariantContext={invariantContext}
        liquids={liquids}
        robotType={robotType}
        deckDef={deckDef}
        labwareEntitiesExtended={labwareEntitiesExtended}
        setSelectedSlot={setSelectedSlot}
        setHoveredSlot={setHoveredSlot}
        hoveredSlot={hoveredSlot}
        selectedRunTimeCommand={selectedRunTimeCommand}
      />
      {/* SlotControls for all empty deck */}
      <DeckViewSlots
        robotState={robotState}
        invariantContext={invariantContext}
        robotType={robotType}
        deckDef={deckDef}
        setSelectedSlot={setSelectedSlot}
        setHoveredSlot={setHoveredSlot}
        hoveredSlot={hoveredSlot}
        stagingAreaCutoutIds={stagingAreaCutoutIds}
        slotIdsBlockedBySpanning={slotIdsBlockedBySpanning}
      />
      {/* all labware on deck/stacks NOT those in modules */}
      <DeckViewLabware
        robotState={robotState}
        invariantContext={invariantContext}
        liquids={liquids}
        robotType={robotType}
        deckDef={deckDef}
        labwareEntitiesExtended={labwareEntitiesExtended}
        setSelectedSlot={setSelectedSlot}
        setHoveredSlot={setHoveredSlot}
        hoveredSlot={hoveredSlot}
        selectedRunTimeCommand={selectedRunTimeCommand}
      />
      {/* when commandSummary happens on a fixture */}
      {isPipetteOverTrash &&
      selectedRunTimeCommand != null &&
      trashAddressableArea != null ? (
        <FixtureCommandSummary
          commandType={selectedRunTimeCommand.commandType}
          slotPosition={getPositionFromSlotId(trashAddressableArea.id, deckDef)}
          slotBoundingBox={trashAddressableArea.boundingBox}
        />
      ) : null}
    </>
  )
}
