import type { RunTimeCommand } from '@opentrons/shared-data'

interface ActiveLayer {
  isActiveLayerVisible: boolean
}

export const getActiveLayer = (
  id: string,
  selectedRunTimeCommand?: RunTimeCommand,
  moduleId?: string
): ActiveLayer => {
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
    isStepAssosciatedWithLabwareId || isMoveStepAssosciatedWithLabwareId

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
