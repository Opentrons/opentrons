import type {
  LabwareDefinition2,
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LabwareSetupItem } from '../../../../pages/Protocols/utils'

export interface NestedLabwareInfo {
  nestedLabwareDisplayName: string
  //    shared location between labware and adapter
  sharedDeckLocation: string
  nestedLabwareDefinition?: LabwareDefinition2
  nestedLabwareNickName?: string
}
export function getNestedLabwareInfo(
  labwareSetupItem: LabwareSetupItem,
  commands: RunTimeCommand[]
): NestedLabwareInfo | null {
  const nestedLabware = commands.find(
    (command): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware' &&
      command.params.location !== 'offDeck' &&
      'labwareId' in command.params.location &&
      command.params.location.labwareId === labwareSetupItem.labwareId
  )
  if (nestedLabware == null) return null

  let sharedDeckLocation = ''
  if (labwareSetupItem.initialLocation !== 'offDeck') {
    const adapterLocation = labwareSetupItem.initialLocation
    if ('slotName' in adapterLocation) {
      sharedDeckLocation = adapterLocation.slotName
    } else if ('moduleId' in adapterLocation) {
      const moduleLocationUnderAdapter = commands.find(
        (command): command is LoadModuleRunTimeCommand =>
          command.commandType === 'loadModule' &&
          command.result?.moduleId === adapterLocation.moduleId
      )
      sharedDeckLocation =
        moduleLocationUnderAdapter?.params.location.slotName ?? ''
    }
  }
  return {
    nestedLabwareDefinition: nestedLabware.result?.definition ?? undefined,
    nestedLabwareDisplayName:
      nestedLabware.result?.definition.metadata.displayName ?? '',
    nestedLabwareNickName: labwareSetupItem.nickName ?? undefined,
    sharedDeckLocation,
  }
}
