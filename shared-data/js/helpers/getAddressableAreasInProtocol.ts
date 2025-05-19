import { MOVABLE_TRASH_A3_ADDRESSABLE_AREA } from '../constants'
import {
  getAddressableAreaFromSlotId,
  getAddressableAreaNamesFromLoadedModule,
} from '../fixtures'

import type { AddressableAreaName } from '../../deck'
import type { ProtocolAnalysisOutput } from '../../protocol'
import type { CompletedProtocolAnalysis, DeckDefinition } from '../types'


// this utility is sorting through load labware  and move labware commands (not onto modules)
// and load module commands to accumulate all addressable areas used in the protocol
// it should not need to be updated for new stacker labware commands but we should verify
// that we get the proper addressable areas for stacker load module commands
export function getAddressableAreasInProtocol(
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  deckDef: DeckDefinition
): AddressableAreaName[] {
  const { commands, labware } = protocolAnalysis

  const addressableAreasFromCommands = commands.reduce<AddressableAreaName[]>(
    (acc, command) => {
      const { commandType, params } = command
      // If moveLabware command and new location is a slot
      if (
        commandType === 'moveLabware' &&
        params.newLocation !== 'offDeck' &&
        params.newLocation !== 'systemLocation' &&
        'slotName' in params.newLocation &&
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
      } 
      // if moveLabware command and new location is type addressable area
      // this will happen if it is a staging slot
      else if (
        commandType === 'moveLabware' &&
        params.newLocation !== 'offDeck' &&
        params.newLocation !== 'systemLocation' &&
        'addressableAreaName' in params.newLocation &&
        !acc.includes(params.newLocation.addressableAreaName)
      ) {
        return [...acc, params.newLocation.addressableAreaName]
      } 
      // slotname scenario for load commands
      else if (
        (commandType === 'loadLabware' ||
          commandType === 'loadLid' ||
          commandType === 'loadLidStack') &&
        params.location !== 'offDeck' &&
        params.location !== 'systemLocation' &&
        'slotName' in params.location &&
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
      } 
      // getting the addressable areas for all slots that are occupied by modules
      // 
      else if (
        commandType === 'loadModule' &&
        !acc.includes(params.location.slotName as AddressableAreaName)
      ) {
        const addressableAreaNames = getAddressableAreaNamesFromLoadedModule(
          params.model,
          params.location.slotName,
          deckDef
        )
        // this is conveniently working but not future proof
        return [...acc, addressableAreaNames[0]]
      } else if (
        (commandType === 'loadLabware' ||
          commandType === 'loadLid' ||
          commandType === 'loadLidStack') &&
        params.location !== 'offDeck' &&
        params.location !== 'systemLocation' &&
        'addressableAreaName' in params.location &&
        !acc.includes(params.location.addressableAreaName)
      ) {
        return [...acc, params.location.addressableAreaName]
      } 
      // these are for disposal locations
      else if (
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
      location !== 'offDeck' &&
      location !== 'systemLocation' &&
      'slotName' in location &&
      location.slotName === 'A3'
  )
    ? MOVABLE_TRASH_A3_ADDRESSABLE_AREA
    : []

  return addressableAreasFromCommands.concat(legacyTrashAddressableArea)
}
