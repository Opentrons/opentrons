import reduce from 'lodash/reduce'
import { getSlotHasMatingSurfaceUnitVector } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { orderBySlot } from '../../../LabwarePositionCheck/utils/labware'
import { getLabwareLocation } from '../utils/getLabwareLocation'
import { getModuleInitialLoadInfo } from '../utils/getModuleInitialLoadInfo'

import type {
  LabwareDefinition2,
  ProtocolFile,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LabwareToOrder } from '../../../LabwarePositionCheck/types'

export const getAllLabwareAndTiprackIdsInOrder = (
  labware: ProtocolFile<{}>['labware'],
  labwareDefinitions: Record<string, LabwareDefinition2>,
  commands: RunTimeCommand[]
): string[] => {
  const unorderedLabware = reduce<typeof labware, LabwareToOrder[]>(
    labware,
    (unorderedLabware, currentLabware, labwareIndex) => {
      //  @ts-expect-error: definitionUri will exist when we remove the schemaV6Adapter
      const labwareDef = labwareDefinitions[currentLabware.definitionUri]
      const labwareLocation = getLabwareLocation(
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        labware[labwareIndex].id,
        commands
      )

      if ('moduleId' in labwareLocation) {
        return [
          ...unorderedLabware,
          {
            definition: labwareDef,
            //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
            labwareId: labware[labwareIndex].id,
            slot: getModuleInitialLoadInfo(labwareLocation.moduleId, commands)
              .location.slotName,
          },
        ]
      } else {
        if (
          !getSlotHasMatingSurfaceUnitVector(
            standardDeckDef as any,
            labwareLocation.slotName.toString()
          )
        ) {
          return [...unorderedLabware]
        }
      }
      return [
        ...unorderedLabware,
        {
          definition: labwareDef,
          //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
          labwareId: labware[labwareIndex].id,
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
