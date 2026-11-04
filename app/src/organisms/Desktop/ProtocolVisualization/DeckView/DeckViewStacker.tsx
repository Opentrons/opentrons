import { Fragment } from 'react'

import {
  CenterLabwareInModuleChildSlot,
  COLORS,
  StyledText,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { DeckViewOverlay } from './DeckViewOverlay'
import { LabwareCommandSummary } from './LabwareCommandSummary'
import { LabwareOnDeck } from './LabwareOnDeck'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CoordinateTuple,
  DeckDefinition,
  Liquid,
  ModuleDefinition,
  ModuleType,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../../../../organisms/Desktop/ProtocolVisualization/DeckView'

const STACKER_X_OFFSET = 17
const STACKER_POSITION_OFFSET = 178

interface DeckViewStackerProps {
  robotState: RobotState
  invariantContext: InvariantContext
  liquids: Liquid[]
  deckDef: DeckDefinition
  robotType: RobotType
  labwareEntitiesExtended: Record<string, LabwareEntityExtended>
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  hoveredSlot: string | null
  selectedSlot: string | null
  showModuleCommandSummary: boolean
  showLabwareCommandSummary: boolean
  slot: string
  slotPosition: CoordinateTuple
  moduleDef: ModuleDefinition
  moduleType: ModuleType
  labwareLoadedOnModuleId: string
  selectedRunTimeCommand?: RunTimeCommand
  renderLabware?: boolean
}

export function DeckViewStacker(props: DeckViewStackerProps): JSX.Element {
  const {
    robotState,
    invariantContext,
    liquids,
    deckDef,
    robotType,
    setHoveredSlot,
    setSelectedSlot,
    hoveredSlot,
    selectedSlot,
    labwareEntitiesExtended,
    showModuleCommandSummary,
    showLabwareCommandSummary,
    moduleDef,
    selectedRunTimeCommand,
    slot,
    moduleType,
    labwareLoadedOnModuleId,
    renderLabware = true,
  } = props

  return (
    <>
      {renderLabware ? (
        <>
          <CenterLabwareInModuleChildSlot
            deckId={deckDef.otId}
            slotId={slot}
            moduleDefinition={moduleDef}
            labwareDefinition={
              labwareEntitiesExtended[labwareLoadedOnModuleId].def
            }
          >
            <LabwareOnDeck
              robotState={robotState}
              labwareDef={labwareEntitiesExtended[labwareLoadedOnModuleId].def}
              liquids={liquids}
              labwareId={labwareLoadedOnModuleId}
              x={
                0 +
                (moduleType === FLEX_STACKER_MODULE_TYPE ? STACKER_X_OFFSET : 0)
              }
              y={0}
              setSelectedSlot={setSelectedSlot}
              setHoveredSlot={setHoveredSlot}
            />
            <Fragment key={labwareLoadedOnModuleId}>
              {showModuleCommandSummary &&
              moduleType === THERMOCYCLER_MODULE_TYPE &&
              selectedRunTimeCommand != null ? (
                <LabwareCommandSummary
                  commandType={selectedRunTimeCommand.commandType}
                  position={[0, 0, 0]}
                  labwareDef={
                    labwareEntitiesExtended[labwareLoadedOnModuleId].def
                  }
                  showModuleIcon={false}
                />
              ) : null}
            </Fragment>
          </CenterLabwareInModuleChildSlot>
        </>
      ) : null}
      {moduleType === THERMOCYCLER_MODULE_TYPE ? (
        <DeckViewOverlay
          key={slot}
          slotId={slot}
          slotPosition={[0, 0, 0]}
          slotFillColor={COLORS.purple50}
          robotType={robotType}
          invariantContext={invariantContext}
          robotState={robotState}
          setSelectedSlot={setSelectedSlot}
          setHoveredSlot={setHoveredSlot}
          hover={hoveredSlot}
          selectedSlot={selectedSlot}
        >
          {showModuleCommandSummary || showLabwareCommandSummary ? null : (
            <StyledText desktopStyle="captionRegular" color={COLORS.white}>
              {
                labwareEntitiesExtended[labwareLoadedOnModuleId].def.metadata
                  .displayName
              }
            </StyledText>
          )}
        </DeckViewOverlay>
      ) : (
        <DeckViewOverlay
          key={slot}
          slotId={
            moduleType === FLEX_STACKER_MODULE_TYPE ? `hopper${slot}` : slot
          }
          slotPosition={[
            moduleType === FLEX_STACKER_MODULE_TYPE
              ? STACKER_POSITION_OFFSET
              : 0,
            0,
            0,
          ]}
          slotFillColor={COLORS.purple50}
          robotType={robotType}
          invariantContext={invariantContext}
          robotState={robotState}
          setSelectedSlot={setSelectedSlot}
          setHoveredSlot={setHoveredSlot}
          hover={hoveredSlot}
          selectedSlot={selectedSlot}
        >
          {(moduleType === FLEX_STACKER_MODULE_TYPE &&
            selectedRunTimeCommand?.commandType !== 'flexStacker/retrieve') ||
          (moduleType !== FLEX_STACKER_MODULE_TYPE &&
            (showModuleCommandSummary || showLabwareCommandSummary)) ? null : (
            <StyledText desktopStyle="captionRegular" color={COLORS.white}>
              {labwareEntitiesExtended[labwareLoadedOnModuleId]?.nickName ??
                labwareEntitiesExtended[labwareLoadedOnModuleId].def.metadata
                  .displayName}
            </StyledText>
          )}
        </DeckViewOverlay>
      )}
    </>
  )
}
