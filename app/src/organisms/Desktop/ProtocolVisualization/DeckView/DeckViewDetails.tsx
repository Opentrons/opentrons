import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getFixtureSummaryInfo } from '../utils/getFixtureSummaryInfo'
import { getSlotIdsBlockedBySpanningForThermocycler } from '../utils/getSlotIdsBlockedBySpanningForThermocycler'
import { DeckViewLabware } from './DeckViewLabware'
import { DeckViewLabwareCommandSummaries } from './DeckViewLabwareCommandSummaries'
import { DeckViewModuleCommandSummaries } from './DeckViewModuleCommandSummaries'
import { DeckViewModules } from './DeckViewModules'
import { DeckViewSlots } from './DeckViewSlots'
import { FixtureCommandSummary } from './FixtureCommandSummary'
import { Ot2FixedTrashCommandSummary } from './Ot2FixedTrashCommandSummary'

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
import type { LabwareEntityExtended } from '.'

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
  selectedSlot: string | null
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
    selectedSlot,
    liquids,
    labwareEntitiesExtended,
  } = props
  const { modules, pipettes } = robotState
  const { moduleEntities, trashBinEntities, wasteChuteEntities } =
    invariantContext
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    modules,
    moduleEntities,
    robotType
  )
  const {
    isPipetteOverTrash: isPipetteOverTrashBin,
    trashLikeEntityCutoutId: trashCutoutId,
  } = getFixtureSummaryInfo(pipettes, trashBinEntities, selectedRunTimeCommand)
  const {
    isPipetteOverTrash: isPipetteOverWasteChute,
    trashLikeEntityCutoutId: wasteChuteCutoutId,
  } = getFixtureSummaryInfo(
    pipettes,
    wasteChuteEntities,
    selectedRunTimeCommand
  )

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
        selectedSlot={selectedSlot}
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
        selectedSlot={selectedSlot}
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
        selectedSlot={selectedSlot}
        selectedRunTimeCommand={selectedRunTimeCommand}
      />
      {/* when commandSummary happens on a trash bin */}
      {isPipetteOverTrashBin &&
      selectedRunTimeCommand != null &&
      trashCutoutId != null ? (
        robotType === FLEX_ROBOT_TYPE ? (
          <FixtureCommandSummary
            commandType={selectedRunTimeCommand.commandType}
            cutoutId={trashCutoutId as CutoutId}
            type="trashBin"
          />
        ) : (
          <Ot2FixedTrashCommandSummary
            commandType={selectedRunTimeCommand.commandType}
            cutoutId={trashCutoutId as CutoutId}
          />
        )
      ) : null}
      {/* when commandSummary happens on a waste chute */}
      {isPipetteOverWasteChute &&
      selectedRunTimeCommand != null &&
      wasteChuteCutoutId != null ? (
        <FixtureCommandSummary
          commandType={selectedRunTimeCommand.commandType}
          cutoutId={wasteChuteCutoutId as CutoutId}
          type="wasteChute"
        />
      ) : null}
      <DeckViewModuleCommandSummaries
        robotState={robotState}
        invariantContext={invariantContext}
        deckDef={deckDef}
        robotType={robotType}
        selectedRunTimeCommand={selectedRunTimeCommand}
      />
      <DeckViewLabwareCommandSummaries
        robotState={robotState}
        invariantContext={invariantContext}
        deckDef={deckDef}
        labwareEntitiesExtended={labwareEntitiesExtended}
        selectedRunTimeCommand={selectedRunTimeCommand}
      />
    </>
  )
}
