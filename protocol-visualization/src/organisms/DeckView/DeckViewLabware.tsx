import { Fragment, useMemo } from 'react'

import { CenterLabwareInSlot, COLORS, StyledText } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getPositionFromSlotId,
  PROTOCOL_ENGINE_LID_STACK_LOADNAME,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getActiveLayer } from '../utils/getActiveLayer'
import { DeckViewOverlay } from './DeckViewOverlay'
import { LabwareCommandSummary } from './LabwareCommandSummary'
import { LabwareOnDeck } from './LabwareOnDeck'

import type { Dispatch, SetStateAction } from 'react'
import type {
  DeckDefinition,
  Liquid,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '.'

interface DeckViewLabwareProps {
  robotState: RobotState
  invariantContext: InvariantContext
  liquids: Liquid[]
  deckDef: DeckDefinition
  robotType: RobotType
  labwareEntitiesExtended: Record<string, LabwareEntityExtended>
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  hoveredSlot: string | null
  selectedRunTimeCommand?: RunTimeCommand
}
export function DeckViewLabware(props: DeckViewLabwareProps): JSX.Element {
  const {
    robotState,
    invariantContext,
    liquids,
    deckDef,
    robotType,
    labwareEntitiesExtended,
    setSelectedSlot,
    setHoveredSlot,
    hoveredSlot,
    selectedRunTimeCommand,
  } = props
  const { labware, modules, pipettes } = robotState

  const labwareEntries = useMemo(
    () =>
      Object.entries(labware).flatMap(([id, lw]) => {
        if (
          Object.keys(modules).some(moduleId => lw.stack.includes(moduleId)) ||
          labwareEntitiesExtended[id].def.parameters.loadName ===
            PROTOCOL_ENGINE_LID_STACK_LOADNAME
        ) {
          return []
        }
        const slot = getSlotInLocationStack(lw.stack)
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          return []
        }

        const { isActiveLayerVisible } = getActiveLayer(
          id,
          pipettes,
          selectedRunTimeCommand
        )
        const showCommandSummary =
          isActiveLayerVisible && selectedRunTimeCommand != null

        return [{ id, lw, slot, slotPosition, showCommandSummary }]
      }),
    [
      labware,
      modules,
      labwareEntitiesExtended,
      deckDef,
      pipettes,
      selectedRunTimeCommand,
    ]
  )
  return (
    <>
      {labwareEntries.map(({ id, slot, slotPosition, showCommandSummary }) => (
        <Fragment key={id}>
          <g transform={`translate(${slotPosition[0]}, ${slotPosition[1]})`}>
            <CenterLabwareInSlot definition={labwareEntitiesExtended[id].def}>
              <LabwareOnDeck
                x={0}
                y={0}
                robotState={robotState}
                labwareDef={labwareEntitiesExtended[id].def}
                liquids={liquids}
                labwareId={id}
                setSelectedSlot={setSelectedSlot}
                setHoveredSlot={setHoveredSlot}
              />
            </CenterLabwareInSlot>
          </g>
          <DeckViewOverlay
            key={`${slot}_hoveredSlot_labware`}
            slotId={slot}
            slotPosition={slotPosition}
            slotFillColor={COLORS.purple50}
            robotType={robotType}
            invariantContext={invariantContext}
            robotState={robotState}
            setSelectedSlot={setSelectedSlot}
            setHoveredSlot={setHoveredSlot}
            hover={hoveredSlot}
          >
            {showCommandSummary ? null : (
              <StyledText desktopStyle="captionRegular" color={COLORS.white}>
                {labwareEntitiesExtended[id]?.nickName ??
                  labwareEntitiesExtended[id].def.metadata.displayName}
              </StyledText>
            )}
          </DeckViewOverlay>
        </Fragment>
      ))}

      {labwareEntries.map(({ id, slotPosition, showCommandSummary }) =>
        showCommandSummary && selectedRunTimeCommand != null ? (
          <LabwareCommandSummary
            key={`${id}_summary`}
            commandType={selectedRunTimeCommand.commandType}
            position={slotPosition}
            labwareDef={labwareEntitiesExtended[id].def}
            showModuleIcon={false}
          />
        ) : null
      )}
    </>
  )
}
