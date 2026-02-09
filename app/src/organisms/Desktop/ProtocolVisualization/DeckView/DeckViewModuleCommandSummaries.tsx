import {
  getModuleDef,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'

import { getActiveLayer } from '../utils/getActiveLayer'
import { getTopmostLabwareOnModuleFromStack } from '../utils/getTopmostLabwareOnModuleFromStack'
import { ModuleCommandSummary } from './ModuleCommandSummary'

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
): JSX.Element {
  const {
    robotState,
    invariantContext,
    deckDef,
    robotType,
    selectedRunTimeCommand,
  } = props
  const { moduleEntities } = invariantContext
  const { modules, labware } = robotState

  return (
    <>
      {Object.entries(modules).map(([id, { slot }]) => {
        const slotPosition = getPositionFromSlotId(slot, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slot} for module ${id}`)
          return null
        }
        const labwareLoadedOnModuleId = getTopmostLabwareOnModuleFromStack(
          id,
          Object.values(labware)
        )
        const { isActiveLayerVisible } = getActiveLayer(
          labwareLoadedOnModuleId,
          selectedRunTimeCommand,
          id
        )
        const isStepAssociatedWithModule =
          selectedRunTimeCommand != null &&
          'moduleId' in selectedRunTimeCommand.params &&
          selectedRunTimeCommand.params.moduleId === id
        const showLabwareCommandSummary =
          isStepAssociatedWithModule && labwareLoadedOnModuleId != null
        const showModuleCommandSummary =
          (isActiveLayerVisible || isStepAssociatedWithModule) &&
          selectedRunTimeCommand != null &&
          !showLabwareCommandSummary

        if (!showModuleCommandSummary) return null

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
