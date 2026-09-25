import { PARTIAL_NOZZLE_MAP } from '@opentrons/shared-data'

import type {
  LabwareDefinition2,
  PartialPrimaryNozzles,
} from '@opentrons/shared-data'

export const getTransformedWellsForPartialColumn = (args: {
  labwareDef: LabwareDefinition2
  wells: string[]
  primaryNozzle: PartialPrimaryNozzles
}): string[] => {
  const { labwareDef, wells, primaryNozzle } = args

  // transform partial nozzle to H1 nozzle
  const nozzleOffsetCount = PARTIAL_NOZZLE_MAP[primaryNozzle] - 1
  const { ordering, parameters } = labwareDef

  return wells.map(well => {
    const column = ordering.find(col => col.includes(well))
    if (column == null) {
      console.warn(
        `Could not find column for ${well} in ${parameters.loadName}`
      )
      return well
    }

    // single-well column (like a reservoir): no transformation needed
    if (column.length === 1) {
      return well
    }
    const foundWellIndex = column.indexOf(well)
    if (foundWellIndex === -1) {
      console.warn(`Could not find column index of ${well}`)
      return well
    }
    return column[foundWellIndex + nozzleOffsetCount]
  })
}
