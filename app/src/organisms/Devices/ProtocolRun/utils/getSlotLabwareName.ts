import {
  getLabwareDisplayName,
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

export function getSlotLabwareName(
  labwareId: string,
  commands?: RunTimeCommand[]
): { slotName: string; labwareName: string } {
  const loadLabwareAndAdapterCommands = commands?.filter(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware'
  )

  const loadLabwareCommand = loadLabwareAndAdapterCommands?.find(
    command => command.result?.labwareId === labwareId
  )
  const loadModuleCommands = commands?.filter(
    command => command.commandType === 'loadModule'
  )
  if (loadLabwareCommand == null) {
    return { slotName: '', labwareName: labwareId }
  }
  const labwareName =
    loadLabwareCommand.result?.definition != null
      ? getLabwareDisplayName(loadLabwareCommand.result?.definition)
      : ''

  let slotName = ''
  const labwareLocation = loadLabwareCommand.params.location

  if (labwareLocation === 'offDeck') {
    slotName = ''
  } else if ('slotName' in labwareLocation) {
    slotName = labwareLocation.slotName
  } else if ('moduleId' in labwareLocation) {
    const loadModuleCommand = loadModuleCommands?.find(
      command => command.result?.moduleId === labwareLocation.moduleId
    )
    slotName =
      loadModuleCommand != null && 'location' in loadModuleCommand.params
        ? loadModuleCommand?.params.location.slotName
        : ''
  } else {
    const adapterCommandLabwareIsOn = loadLabwareAndAdapterCommands?.find(
      command =>
        command.result != null
          ? command.result?.labwareId === labwareLocation.labwareId
          : ''
    )
    if (adapterCommandLabwareIsOn?.params == null) {
      slotName = ''
    } else if (
      adapterCommandLabwareIsOn?.params.location !== 'offDeck' &&
      'slotName' in adapterCommandLabwareIsOn?.params.location
    ) {
      slotName = adapterCommandLabwareIsOn?.params.location.slotName
    } else if (
      adapterCommandLabwareIsOn?.params.location !== 'offDeck' &&
      'moduleId' in adapterCommandLabwareIsOn?.params.location
    ) {
      const moduleId = adapterCommandLabwareIsOn?.params.location.moduleId
      const loadModuleCommand = loadModuleCommands?.find(
        command => command.result?.moduleId === moduleId
      )
      slotName =
        loadModuleCommand != null && 'location' in loadModuleCommand.params
          ? loadModuleCommand?.params.location.slotName
          : ''
    }
  }
  return {
    slotName,
    labwareName,
  }
}
