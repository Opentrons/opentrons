import {
  getModuleDef,
  getModuleParentOriginToChildSlotOrigin,
  getPositionFromSlotId,
} from '@opentrons/shared-data'

import { getTopmostLabwareOnModuleFromStack } from '../utils/getTopmostLabwareOnModuleFromStack'
import { LabwareCommandSummary } from './LabwareCommandSummary'

import type { DeckDefinition, RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../../../../organisms/Desktop/ProtocolVisualization/DeckView'

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
  const { modules, labware } = robotState

  return (
    <>
      {Object.entries(modules).map(([id, { slot }]) => {
        const isStepAssociatedWithModule =
          selectedRunTimeCommand != null &&
          'moduleId' in selectedRunTimeCommand.params &&
          selectedRunTimeCommand.params.moduleId === id
        if (!isStepAssociatedWithModule) return null

        const labwareLoadedOnModuleId = getTopmostLabwareOnModuleFromStack(
          id,
          Object.values(labware)
        )
        if (labwareLoadedOnModuleId == null) return null

        const slotPosition = getPositionFromSlotId(slot, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slot} for module ${id}`)
          return null
        }

        const moduleDef = getModuleDef(moduleEntities[id].model)
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

        return (
          <LabwareCommandSummary
            key={`labware_command_summary_${id}`}
            commandType={selectedRunTimeCommand.commandType}
            position={childSlotPosition}
            labwareDef={labwareEntitiesExtended[labwareLoadedOnModuleId].def}
            showModuleIcon={false}
          />
        )
      })}
    </>
  )
}
