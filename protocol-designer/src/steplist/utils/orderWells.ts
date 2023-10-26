import intersection from 'lodash/intersection'
import { LabwareDefinition2, orderWells } from '@opentrons/shared-data'
import { WellOrderOption } from '../../form-types'
export function getOrderedWells(
  unorderedWells: string[],
  labwareDefOrdering: LabwareDefinition2['ordering'],
  wellOrderFirst: WellOrderOption,
  wellOrderSecond: WellOrderOption
): string[] {
  const allWellsOrdered = orderWells(
    labwareDefOrdering,
    wellOrderFirst,
    wellOrderSecond
  )
  return intersection(allWellsOrdered, unorderedWells)
}
