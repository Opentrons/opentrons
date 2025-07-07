import type { LabwareDefinition } from '../types'

export const getWellTotalVolume = (
  labwareDef: LabwareDefinition,
  wellName: string
): number | null | undefined => {
  const well = labwareDef.wells[wellName]

  if (!well) {
    console.warn(
      `No well "${wellName}" found for labware ${labwareDef?.namespace}/${labwareDef?.parameters?.loadName}/${labwareDef?.version}"`
    )
    return null
  }

  return well.totalLiquidVolume
}
