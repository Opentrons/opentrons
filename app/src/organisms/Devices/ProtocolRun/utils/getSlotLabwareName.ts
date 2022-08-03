import { getLabwareDisplayName, RunTimeCommand } from '@opentrons/shared-data'

export function getSlotLabwareName(
  labwareId: string,
  commands?: RunTimeCommand[]
): { slotName: string; labwareName: string } {
  const loadLabwareCommands = commands?.filter(
    command => command.commandType === 'loadLabware'
  )
  const loadLabwareCommand = loadLabwareCommands?.find(
    command => command.result.labwareId === labwareId
  )
  if (loadLabwareCommand == null) {
    return { slotName: '', labwareName: labwareId }
  }
  const labwareName = getLabwareDisplayName(
    loadLabwareCommand.result.definition
  )
  let slotName = ''
  const labwareLocation =
    'location' in loadLabwareCommand.params
      ? loadLabwareCommand.params.location
      : ''
  if ('slotName' in labwareLocation) {
    slotName = labwareLocation.slotName
  } else {
    const loadModuleCommands = commands?.filter(
      command => command.commandType === 'loadModule'
    )
    const loadModuleCommand = loadModuleCommands?.find(
      command => command.result.moduleId === labwareLocation.moduleId
    )
    slotName =
      loadModuleCommand != null && 'location' in loadModuleCommand.params
        ? loadModuleCommand?.params.location.slotName
        : ''
  }

  return {
    slotName,
    labwareName,
  }
}
