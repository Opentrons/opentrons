import { Fragment } from 'react'

import { COLORS, StyledText } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getPositionFromSlotId,
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
  const { labware, modules } = robotState
  return (
    <>
      {Object.entries(labware).map(([id, lw]) => {
        if (
          Object.keys(modules).some(moduleId => lw.stack.includes(moduleId))
        ) {
          return null
        }
        const slot = getSlotInLocationStack(lw.stack)
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(
            `no slot ${slot} for labware ${Object.keys(labware)[0]}!`
          )
          return null
        }
        const { isActiveLayerVisible } = getActiveLayer(
          id,
          selectedRunTimeCommand
        )
        const showCommandSummary =
          isActiveLayerVisible && selectedRunTimeCommand != null
        return (
          <Fragment key={id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              robotState={robotState}
              labwareDef={labwareEntitiesExtended[id].def}
              liquids={liquids}
              labwareId={id}
              setSelectedSlot={setSelectedSlot}
              setHoveredSlot={setHoveredSlot}
            />
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
            {showCommandSummary ? (
              <LabwareCommandSummary
                commandType={selectedRunTimeCommand.commandType}
                position={slotPosition}
                labwareDef={labwareEntitiesExtended[id].def}
                showModuleIcon={false}
              />
            ) : null}
          </Fragment>
        )
      })}
    </>
  )
}
