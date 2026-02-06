import type { RunTimeCommand } from '@opentrons/shared-data'
import type { PipetteTemporalProperties } from '@opentrons/step-generation'

interface ActiveLayer {
  isActiveLayerVisible: boolean
}

export const getActiveLayer = (
  id: string,
  pipetteState: {
    [pipetteId: string]: PipetteTemporalProperties
  },
  selectedRunTimeCommand?: RunTimeCommand,
  moduleId?: string
): ActiveLayer => {
  const pipetteEntityId = Object.values(pipetteState).find(
    pipette => pipette.entityId === id
  )
  const isStepAssosciatedWithLabwareId =
    selectedRunTimeCommand != null &&
    'labwareId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.labwareId === id

  const isMoveStepAssosciatedWithLabwareId =
    selectedRunTimeCommand != null &&
    selectedRunTimeCommand.commandType === 'moveLabware' &&
    'labwareId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.labwareId === id

  const isStepAssosciatedWithLabware =
    isStepAssosciatedWithLabwareId ||
    isMoveStepAssosciatedWithLabwareId ||
    pipetteEntityId != null

  const isStepAssociatedWithModuleId =
    moduleId != null &&
    selectedRunTimeCommand != null &&
    'moduleId' in selectedRunTimeCommand.params &&
    selectedRunTimeCommand.params.moduleId === moduleId

  return {
    isActiveLayerVisible:
      isStepAssosciatedWithLabware || isStepAssociatedWithModuleId,
  }
}
