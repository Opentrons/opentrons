// @flow
import intersection from 'lodash/intersection'
import { orderWells } from '@opentrons/step-generation'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellOrderOption } from '../../form-types'

export function getOrderedWells(
  unorderedWells: Array<string>,
  labwareDef: LabwareDefinition2,
  wellOrderFirst: WellOrderOption,
  wellOrderSecond: WellOrderOption
): Array<string> {
  const allWellsOrdered = orderWells(
    labwareDef.ordering,
    wellOrderFirst,
    wellOrderSecond
  )
  return intersection(allWellsOrdered, unorderedWells)
}
