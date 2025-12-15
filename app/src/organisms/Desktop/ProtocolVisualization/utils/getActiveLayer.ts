import type { RunTimeCommand } from '@opentrons/shared-data'

interface ActiveLayer {
  isActiveLayerVisible: boolean
}

export const getActiveLayer = (
  id: string,
  selectedRunTimeCommand?: RunTimeCommand
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

  return {
    isActiveLayerVisible: isStepAssosciatedWithLabware,
  }
}
