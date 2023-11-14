import { getStagingAreaAddressableAreas } from '../../../utils'
import type { CreateCommand, CutoutId } from '@opentrons/shared-data'
import type { AdditionalEquipment } from '../FileSidebar'

export const getUnusedStagingAreas = (
  additionalEquipment: AdditionalEquipment,
  commands?: CreateCommand[]
): string[] => {
  const stagingAreaCutoutIds = Object.values(additionalEquipment)
    .filter(equipment => equipment?.name === 'stagingArea')
    .map(equipment => {
      if (equipment.location == null) {
        console.error(
          `expected to find staging area slot location with id ${equipment.id} but could not.`
        )
      }
      return equipment.location ?? ''
    })

  const stagingAreaAddressableAreaNames = getStagingAreaAddressableAreas(
    //  TODO(jr, 11/13/23): fix AdditionalEquipment['location'] from type string to CutoutId
    stagingAreaCutoutIds as CutoutId[]
  )

  const stagingAreaCommandSlots: string[] = stagingAreaAddressableAreaNames.filter(
    location =>
      commands?.filter(
        command =>
          (command.commandType === 'loadLabware' &&
            command.params.location !== 'offDeck' &&
            'slotName' in command.params.location &&
            command.params.location.slotName === location) ||
          (command.commandType === 'moveLabware' &&
            command.params.newLocation !== 'offDeck' &&
            'slotName' in command.params.newLocation &&
            command.params.newLocation.slotName === location)
      )
        ? location
        : null
  )

  return stagingAreaCommandSlots
}
