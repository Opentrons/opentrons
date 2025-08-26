import type { LabwareByLiquidId } from './getLabwareInfoByLiquidId'

export function getLiquidsByIdForLabware(
  labwareId: string,
  labwareByLiquidId: LabwareByLiquidId
): LabwareByLiquidId {
  return Object.entries(labwareByLiquidId).reduce(
    (acc, [liquidId, labwareArray]) => {
      const filteredArray = labwareArray.filter(
        labware => labware.labwareId === labwareId
      )
      if (filteredArray.length > 0) {
        return { ...acc, [liquidId]: filteredArray }
      }
      return acc
    },
    {}
  )
}
