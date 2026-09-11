import {
  getModuleDef,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'

import { ModuleCommandSummary } from './ModuleCommandSummary'

import type { ReactNode } from 'react'
import type {
  DeckDefinition,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface DeckViewModuleCommandSummariesProps {
  robotState: RobotState
  invariantContext: InvariantContext
  deckDef: DeckDefinition
  robotType: RobotType
  selectedRunTimeCommand?: RunTimeCommand
}

export function DeckViewModuleCommandSummaries(
  props: DeckViewModuleCommandSummariesProps
): ReactNode {
  const {
    robotState,
    invariantContext,
    deckDef,
    robotType,
    selectedRunTimeCommand,
  } = props
  const { moduleEntities } = invariantContext
  const { modules } = robotState

  return (
    <>
      {Object.entries(modules).map(([id, { slot }]) => {
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slot} for module ${id}`)
          return null
        }
        const hasModuleIdParam =
          selectedRunTimeCommand != null &&
          'params' in selectedRunTimeCommand &&
          'moduleId' in selectedRunTimeCommand.params
        const moduleIdInParams = hasModuleIdParam
          ? (selectedRunTimeCommand.params as { moduleId: string }).moduleId
          : null
        const isStepAssociatedWithModule =
          hasModuleIdParam && moduleIdInParams === id
        const showModuleCommandSummary =
          isStepAssociatedWithModule && selectedRunTimeCommand != null

        if (!showModuleCommandSummary) {
          return null
        }

        const moduleDef = getModuleDef(moduleEntities[id].model)

        return (
          <ModuleCommandSummary
            key={`module_command_summary_${id}`}
            robotType={robotType}
            moduleModel={moduleDef.model}
            commandType={selectedRunTimeCommand.commandType}
            position={slotPosition}
            showModuleIcon={false}
            slot={slot}
            orientation={inferModuleOrientationFromXCoordinate(slotPosition[0])}
          />
        )
      })}
    </>
  )
}
