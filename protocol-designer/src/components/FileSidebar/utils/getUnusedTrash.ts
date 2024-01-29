import {
  AddressableAreaName,
  CreateCommand,
  FIXED_TRASH_ID,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'
import type { InitialDeckSetup } from '../../../step-forms'

interface UnusedTrash {
  trashBinUnused: boolean
  wasteChuteUnused: boolean
}

export const getUnusedTrash = (
  additionalEquipment: InitialDeckSetup['additionalEquipmentOnDeck'],
  commands?: CreateCommand[]
): UnusedTrash => {
  const trashBin = Object.values(additionalEquipment).find(
    aE => aE.name === 'trashBin'
  )

  const hasTrashBinCommands =
    trashBin != null
      ? commands?.some(
          command =>
            (command.commandType === 'moveToAddressableArea' &&
              (MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
                command.params.addressableAreaName as AddressableAreaName
              ) ||
                command.params.addressableAreaName === FIXED_TRASH_ID)) ||
            command.commandType === 'moveToAddressableAreaForDropTip'
        )
      : null
  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const hasWasteChuteCommands =
    wasteChute != null
      ? commands?.some(
          command =>
            command.commandType === 'moveToAddressableArea' &&
            WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
              command.params.addressableAreaName as AddressableAreaName
            )
        )
      : null

  return {
    trashBinUnused: trashBin != null && !hasTrashBinCommands,
    wasteChuteUnused: wasteChute != null && !hasWasteChuteCommands,
  }
}
