import { MOVABLE_TRASH_A3_ADDRESSABLE_AREA } from '../constants'
import { getAddressableAreaFromSlotId } from '../fixtures'
import type { AddressableAreaName } from '../../deck'
import type { ProtocolAnalysisOutput } from '../../protocol'
import type { CompletedProtocolAnalysis, DeckDefinition } from '../types'

export function getAddressableAreasInProtocol(
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  deckDef: DeckDefinition
): AddressableAreaName[] {
  const { commands, labware } = protocolAnalysis

  const addressableAreasFromCommands = commands.reduce<AddressableAreaName[]>(
    (acc, command) => {
      if (
        command.commandType === 'moveLabware' &&
        command.params.newLocation !== 'offDeck' &&
        'slotName' in command.params.newLocation &&
        !acc.includes(
          command.params.newLocation.slotName as AddressableAreaName
        )
      ) {
        const addressableAreaName = getAddressableAreaFromSlotId(
          command.params.newLocation.slotName,
          deckDef
        )?.id

        if (addressableAreaName == null) {
          return acc
        } else {
          return [...acc, addressableAreaName]
        }
      } else if (
        command.commandType === 'moveLabware' &&
        command.params.newLocation !== 'offDeck' &&
        'addressableAreaName' in command.params.newLocation &&
        !acc.includes(command.params.newLocation.addressableAreaName)
      ) {
        return [...acc, command.params.newLocation.addressableAreaName]
      } else if (
        (command.commandType === 'loadLabware' ||
          command.commandType === 'loadModule') &&
        command.params.location !== 'offDeck' &&
        'slotName' in command.params.location &&
        !acc.includes(command.params.location.slotName as AddressableAreaName)
      ) {
        const addressableAreaName = getAddressableAreaFromSlotId(
          command.params.location.slotName,
          deckDef
        )?.id

        // do not add addressable area name for legacy trash labware
        if (
          addressableAreaName == null ||
          ('loadName' in command.params &&
            command.params.loadName === 'opentrons_1_trash_3200ml_fixed')
        ) {
          return acc
        } else {
          return [...acc, addressableAreaName]
        }
      } else if (
        command.commandType === 'loadLabware' &&
        command.params.location !== 'offDeck' &&
        'addressableAreaName' in command.params.location &&
        !acc.includes(command.params.location.addressableAreaName)
      ) {
        return [...acc, command.params.location.addressableAreaName]
      } else if (
        command.commandType === 'moveToAddressableArea' &&
        !acc.includes(command.params.addressableAreaName)
      ) {
        return [...acc, command.params.addressableAreaName]
      } else if (
        command.commandType === 'moveToAddressableAreaForDropTip' &&
        !acc.includes(command.params.addressableAreaName)
      ) {
        return [...acc, command.params.addressableAreaName]
      } else {
        return acc
      }
    },
    []
  )

  // special-case the Flex trash labware load name in A3 for back compatibility with the legacy fixed trash load labware command
  const legacyTrashAddressableArea = labware.some(
    ({ loadName, location }) =>
      loadName === 'opentrons_1_trash_3200ml_fixed' &&
      location !== 'offDeck' &&
      'slotName' in location &&
      location.slotName === 'A3'
  )
    ? MOVABLE_TRASH_A3_ADDRESSABLE_AREA
    : []

  return addressableAreasFromCommands.concat(legacyTrashAddressableArea)
}
