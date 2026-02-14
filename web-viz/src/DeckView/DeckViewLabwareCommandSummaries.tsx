import { Fragment } from 'react'

import {
  getAddressableAreaFromSlotId,
  getModuleDef,
  getModuleParentOriginToChildSlotOrigin,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getActiveLayer } from '../utils/getActiveLayer'
import { LabwareCommandSummary } from './LabwareCommandSummary'

import type { DeckDefinition, RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from './index'

interface DeckViewLabwareCommandSummariesProps {
  robotState: RobotState
  invariantContext: InvariantContext
  deckDef: DeckDefinition
  labwareEntitiesExtended: Record<string, LabwareEntityExtended>
  selectedRunTimeCommand?: RunTimeCommand
}

export function DeckViewLabwareCommandSummaries(
  props: DeckViewLabwareCommandSummariesProps
): JSX.Element {
  const {
    robotState,
    invariantContext,
    deckDef,
    labwareEntitiesExtended,
    selectedRunTimeCommand,
  } = props
  const { moduleEntities } = invariantContext
  const { modules, labware, pipettes } = robotState

  return (
    <>
      {Object.entries(labware).map(([id, lw]) => {
        if (
          !Object.keys(modules).some(moduleId => lw.stack.includes(moduleId))
        ) {
          return null
        }
        const moduleUnderLabware = lw.stack.find(id => modules[id] != null)
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

        const moduleDef =
          moduleUnderLabware != null
            ? getModuleDef(moduleEntities[moduleUnderLabware].model)
            : null

        if (moduleDef == null) {
          console.warn(`expected to find a moduleDef assosciated with ${id}`)
          return null
        }
        const childSlotOffset = getModuleParentOriginToChildSlotOrigin(
          deckDef.otId,
          slot,
          moduleDef
        )

        const childSlotPosition: [number, number, number] = [
          slotPosition[0] + childSlotOffset.x,
          slotPosition[1] + childSlotOffset.y,
          slotPosition[2] + childSlotOffset.z,
        ]

        const { isActiveLayerVisible } = getActiveLayer(
          id,
          pipettes,
          selectedRunTimeCommand
        )
        const showCommandSummary =
          isActiveLayerVisible && selectedRunTimeCommand != null

        return (
          <Fragment key={id}>
            {showCommandSummary ? (
              <LabwareCommandSummary
                commandType={selectedRunTimeCommand.commandType}
                position={childSlotPosition}
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
