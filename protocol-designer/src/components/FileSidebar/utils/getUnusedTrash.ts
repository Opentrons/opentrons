import {
  FLEX_TRASH_DEF_URI,
  OT_2_TRASH_DEF_URI,
} from '@opentrons/step-generation'

import type { CreateCommand } from '@opentrons/shared-data'
import type { InitialDeckSetup } from '../../../step-forms'

interface UnusedTrash {
  trashBinUnused: boolean
  wasteChuteUnused: boolean
}

export const getUnusedTrash = (
  labwareOnDeck: InitialDeckSetup['labware'],
  additionalEquipment: InitialDeckSetup['additionalEquipmentOnDeck'],
  commands?: CreateCommand[]
): UnusedTrash => {
  const trashBin = Object.values(labwareOnDeck).find(
    labware =>
      labware.labwareDefURI === FLEX_TRASH_DEF_URI ||
      labware.labwareDefURI === OT_2_TRASH_DEF_URI
  )
  const hasTrashBinCommands =
    trashBin != null
      ? commands?.some(
          command =>
            (command.commandType === 'dropTip' &&
              command.params.labwareId === trashBin.id) ||
            (command.commandType === 'dispense' &&
              command.params.labwareId === trashBin.id)
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
            (command.params.addressableAreaName === '1and8ChannelWasteChute' ||
              command.params.addressableAreaName === 'gripperWasteChute' ||
              command.params.addressableAreaName === '96ChannelWasteChute')
        )
      : null

  return {
    trashBinUnused: trashBin != null && !hasTrashBinCommands,
    wasteChuteUnused: wasteChute != null && !hasWasteChuteCommands,
  }
}
