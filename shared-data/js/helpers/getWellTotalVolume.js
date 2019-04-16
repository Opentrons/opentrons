// @flow
import type { LabwareDefinition2 } from '../'

const getWellTotalVolume = (
  labwareDef: LabwareDefinition2,
  wellName: string
): ?number => {
  const well = labwareDef.wells[wellName]
  if (!well) {
    console.warn(
      `No well "${wellName}" found for labware "${labwareDef &&
        labwareDef.otId}"`
    )
    return null
  }
  return well.totalLiquidVolume
}

export default getWellTotalVolume
