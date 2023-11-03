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

//  TODO(jr, 10/30/23): plug in waste chute logic when we know the commands!
export const getUnusedTrash = (
  labwareOnDeck: InitialDeckSetup['labware'],
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
  return {
    trashBinUnused: trashBin != null && !hasTrashBinCommands,
    wasteChuteUnused: false,
  }
}
