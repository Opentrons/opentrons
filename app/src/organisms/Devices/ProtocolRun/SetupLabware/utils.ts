import { getSlotHasMatingSurfaceUnitVector } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { orderBySlot } from '../../../LabwarePositionCheck/utils/labware'
import { getSlotLabwareName } from '../utils/getSlotLabwareName'

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
  const orderedLabware = labware.reduce<LabwareToOrder[]>(
    (orderedLabware, currentLabware) => {
      const labwareDef = labwareDefinitions[currentLabware.definitionUri]
      const slotName = getSlotLabwareName(currentLabware.id, commands).slotName

      if (
        !getSlotHasMatingSurfaceUnitVector(standardDeckDef as any, slotName)
      ) {
        return [...orderedLabware]
      }
      return [
        ...orderedLabware,
        {
          definition: labwareDef,
          labwareId: currentLabware.id,
          slot: slotName,
        },
      ]
    },
    []
  )
  const orderedLabwareIds = orderedLabware
    .sort(orderBySlot)
    .map(({ labwareId }) => labwareId)

  return orderedLabwareIds
}
