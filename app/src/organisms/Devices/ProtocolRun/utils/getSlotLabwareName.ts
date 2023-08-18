import {
  getLabwareDisplayName,
  getModuleDisplayName,
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
  LoadModuleRunTimeCommand,
} from '@opentrons/shared-data'

export interface SlotInfo {
  slotName: string
  labwareName: string
  adapterName?: string
  moduleName?: string
}

//  TODO: (jr, 8/16/23): probably need to call this a new name and should slotName and labwareName be optional?
//  also TODO: refactor all instances of getSlotLabwareName to display the module and adapter name if applicable
export function getSlotLabwareName(
  labwareId: string,
  commands?: RunTimeCommand[]
): SlotInfo {
  const loadLabwareCommands = commands?.filter(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware'
  )
  const loadLabwareCommand = loadLabwareCommands?.find(
    command => command.result?.labwareId === labwareId
  )
  const loadModuleCommands = commands?.filter(
    (command): command is LoadModuleRunTimeCommand =>
      command.commandType === 'loadModule'
  )
  if (loadLabwareCommand == null) {
    console.warn(
      `could not find the load labware command assosciated with thie labwareId: ${labwareId}`
    )
    return { slotName: '', labwareName: '' }
  }

  const labwareName =
    loadLabwareCommand.result?.definition != null
      ? getLabwareDisplayName(loadLabwareCommand.result?.definition)
      : ''

  const labwareLocation = loadLabwareCommand.params.location

  if (labwareLocation === 'offDeck') {
    return { slotName: 'Off deck', labwareName }
  } else if ('slotName' in labwareLocation) {
    return { slotName: labwareLocation.slotName, labwareName }
  } else if ('moduleId' in labwareLocation) {
    const loadModuleCommandUnderLabware = loadModuleCommands?.find(
      command => command.result?.moduleId === labwareLocation.moduleId
    )
    return loadModuleCommandUnderLabware != null &&
      'location' in loadModuleCommandUnderLabware.params
      ? {
          slotName:
            loadModuleCommandUnderLabware?.params.location.slotName ?? '',
          labwareName,
          moduleName: getModuleDisplayName(
            loadModuleCommandUnderLabware?.params.model
          ),
        }
      : { slotName: '', labwareName: '' }
  } else {
    const loadedAdapterCommand = loadLabwareCommands?.find(command =>
      command.result != null
        ? command.result?.labwareId === labwareLocation.labwareId
        : ''
    )
    if (loadedAdapterCommand?.params == null) {
      console.warn(
        `expected to find an adapter under the labware but could not with labwareId ${labwareLocation.labwareId}`
      )
      return { slotName: '', labwareName: labwareName }
    } else if (
      loadedAdapterCommand?.params.location !== 'offDeck' &&
      'slotName' in loadedAdapterCommand?.params.location
    ) {
      return {
        slotName: loadedAdapterCommand?.params.location.slotName,
        labwareName,
        adapterName:
          loadedAdapterCommand?.result?.definition.metadata.displayName,
      }
    } else if (
      loadedAdapterCommand?.params.location !== 'offDeck' &&
      'moduleId' in loadedAdapterCommand?.params.location
    ) {
      const moduleId = loadedAdapterCommand?.params.location.moduleId
      const loadModuleCommandUnderAdapter = loadModuleCommands?.find(
        command => command.result?.moduleId === moduleId
      )

      return loadModuleCommandUnderAdapter != null &&
        'location' in loadModuleCommandUnderAdapter.params
        ? {
            slotName: loadModuleCommandUnderAdapter.params.location.slotName,
            labwareName,
            adapterName:
              loadedAdapterCommand.result?.definition.metadata.displayName,
            moduleName: getModuleDisplayName(
              loadModuleCommandUnderAdapter.params.model
            ),
          }
        : { slotName: '', labwareName }
    } else {
      //  shouldn't hit this
      return { slotName: '', labwareName }
    }
  }
}
