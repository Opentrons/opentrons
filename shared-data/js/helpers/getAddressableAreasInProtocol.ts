import { MOVABLE_TRASH_A3_ADDRESSABLE_AREA } from '../constants'
import {
  getAddressableAreaFromSlotId,
  getAddressableAreaNamesFromLoadedModule,
} from '../fixtures'
import {
  locationIsOnAddressableArea,
  locationIsOnSlot,
} from './symbolicPositionHelpers'

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
      const { commandType, params } = command
      if (
        commandType === 'moveLabware' &&
        locationIsOnSlot(params.newLocation) &&
        !acc.includes(params.newLocation.slotName as AddressableAreaName)
      ) {
        const addressableAreaName = getAddressableAreaFromSlotId(
          params.newLocation.slotName,
          deckDef
        )?.id

        if (addressableAreaName == null) {
          return acc
        } else {
          return [...acc, addressableAreaName]
        }
      } else if (
        commandType === 'moveLabware' &&
        locationIsOnAddressableArea(params.newLocation) &&
        !acc.includes(params.newLocation.addressableAreaName)
      ) {
        return [...acc, params.newLocation.addressableAreaName]
      } else if (
        (commandType === 'loadLabware' ||
          commandType === 'loadLid' ||
          commandType === 'loadLidStack') &&
        locationIsOnSlot(params.location) &&
        !acc.includes(params.location.slotName as AddressableAreaName)
      ) {
        const addressableAreaName = getAddressableAreaFromSlotId(
          params.location.slotName,
          deckDef
        )?.id

        // do not add addressable area name for legacy trash labware
        if (
          addressableAreaName == null ||
          ('loadName' in params &&
            params.loadName === 'opentrons_1_trash_3200ml_fixed')
        ) {
          return acc
        } else {
          return [...acc, addressableAreaName]
        }
      } else if (
        commandType === 'loadModule' &&
        !acc.includes(params.location.slotName as AddressableAreaName)
      ) {
        const addressableAreaNames = getAddressableAreaNamesFromLoadedModule(
          params.model,
          params.location.slotName,
          deckDef
        )
        return [...acc, addressableAreaNames[0]]
      } else if (
        (commandType === 'loadLabware' ||
          commandType === 'loadLid' ||
          commandType === 'loadLidStack') &&
        locationIsOnAddressableArea(params.location) &&
        !acc.includes(params.location.addressableAreaName)
      ) {
        return [...acc, params.location.addressableAreaName]
      } else if (
        commandType === 'moveToAddressableArea' &&
        !acc.includes(params.addressableAreaName)
      ) {
        return [...acc, params.addressableAreaName]
      } else if (
        commandType === 'moveToAddressableAreaForDropTip' &&
        !acc.includes(params.addressableAreaName)
      ) {
        return [...acc, params.addressableAreaName]
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
      locationIsOnSlot(location) &&
      location.slotName === 'A3'
  )
    ? MOVABLE_TRASH_A3_ADDRESSABLE_AREA
    : []

  return addressableAreasFromCommands.concat(legacyTrashAddressableArea)
}
