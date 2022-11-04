import { getSlotHasMatingSurfaceUnitVector } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { orderBySlot } from '../../../LabwarePositionCheck/utils/labware'
import { getLabwareLocation } from '../utils/getLabwareLocation'
import { getModuleInitialLoadInfo } from '../utils/getModuleInitialLoadInfo'

import type {
  LabwareDefinition2,
  LoadedLabware,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LabwareToOrder } from '../../../LabwarePositionCheck/types'

export const getAllLabwareAndTiprackIdsInOrder = (
  labware: LoadedLabware[],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: RunTimeCommand[]
): string[] => {
  const unorderedLabware = labware.reduce<LabwareToOrder[]>(
    (unorderedLabware, currentLabware) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionId]
      const labwareLocation = getLabwareLocation(currentLabware.id, commands)

      if (labwareLocation === 'offDeck') return unorderedLabware
      if ('moduleId' in labwareLocation) {
        return [
          ...unorderedLabware,
          {
            definition: labwareDef,
            labwareId: currentLabware.id,
            slot: getModuleInitialLoadInfo(labwareLocation.moduleId, commands)
              .location.slotName,
          },
        ]
      } else if (
        !getSlotHasMatingSurfaceUnitVector(
          standardDeckDef as any,
          labwareLocation.slotName.toString()
        )
      ) {
        return unorderedLabware
      }
      return [
        ...unorderedLabware,
        {
          definition: labwareDef,
          labwareId: currentLabware.id,
          slot: labwareLocation.slotName,
        },
      ]
    },
    []
  )
  const orderedLabwareIds = unorderedLabware
    .sort(orderBySlot)
    .map(({ labwareId }) => labwareId)

  return orderedLabwareIds
}
