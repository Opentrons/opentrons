import type { AddressableAreaName } from '../../deck'
import type { RunTimeCommand } from '../../protocol'

export function getAddressableAreasInProtocol(
  commands: RunTimeCommand[]
): AddressableAreaName[] {
  return commands.reduce<AddressableAreaName[]>((acc, command) => {
    if (
      command.commandType === 'moveLabware' &&
      command.params.newLocation !== 'offDeck' &&
      'slotName' in command.params.newLocation &&
      !acc.includes(command.params.newLocation.slotName as AddressableAreaName)
    ) {
      return [
        ...acc,
        command.params.newLocation.slotName as AddressableAreaName,
      ]
    } else if (
      command.commandType === 'moveLabware' &&
      command.params.newLocation !== 'offDeck' &&
      'addressableAreaName' in command.params.newLocation &&
      !acc.includes(
        command.params.newLocation.addressableAreaName as AddressableAreaName
      )
    ) {
      return [
        ...acc,
        command.params.newLocation.addressableAreaName as AddressableAreaName,
      ]
    } else if (
      (command.commandType === 'loadLabware' ||
        command.commandType === 'loadModule') &&
      command.params.location !== 'offDeck' &&
      'slotName' in command.params.location &&
      !acc.includes(command.params.location.slotName as AddressableAreaName)
    ) {
      return [...acc, command.params.location.slotName as AddressableAreaName]
    } else if (
      command.commandType === 'loadLabware' &&
      command.params.location !== 'offDeck' &&
      'addressableAreaName' in command.params.location &&
      !acc.includes(
        command.params.location.addressableAreaName as AddressableAreaName
      )
    ) {
      return [
        ...acc,
        command.params.location.addressableAreaName as AddressableAreaName,
      ]
    } else if (
      command.commandType === 'moveToAddressableArea' &&
      !acc.includes(command.params.addressableAreaName as AddressableAreaName)
    ) {
      return [...acc, command.params.addressableAreaName as AddressableAreaName]
    } else {
      return acc
    }
  }, [])
}
