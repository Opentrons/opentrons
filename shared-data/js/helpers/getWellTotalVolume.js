// @flow
import type { LabwareDefinition2 } from '../types'

export const getWellTotalVolume = (
  labwareDef: LabwareDefinition2,
  wellName: string
): ?number => {
  const well = labwareDef.wells[wellName]
  if (!well) {
    console.warn(
      `No well "${wellName}" found for labware ${labwareDef?.namespace}/${labwareDef?.parameters?.loadName}/${labwareDef?.version}"`
    )
    return null
  }
  return well.totalLiquidVolume
}
