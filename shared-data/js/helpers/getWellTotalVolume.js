// @flow

import getLabware from '../getLabware'

const getWellTotalVolume = (labwareName: string, wellName: string): ?number => {
  const labware = getLabware(labwareName)
  if (!labware) {
    console.warn(`No labware definition found for labware ${labwareName}`)
    return null
  }
  const well = labware.wells[wellName]
  if (!well) {
    console.warn(`No well ${wellName} found for labware ${labwareName}`)
    return null
  }
  return well['total-liquid-volume'] || null
}

export default getWellTotalVolume
