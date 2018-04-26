// @flow
import flatten from 'lodash/flatten'
import {computeWellAccess, getLabware} from '@opentrons/labware-definitions'

type WellSetByWell = Array<Array<string>>

/** Compute all well sets for a labware type.
  * A well set is array of 8 wells that an 8 channel pipettes can fit into,
  * eg ['A1', 'C1', 'D1', 'E1', 'G1', 'I1', 'K1', 'M1'] is a well set in a 384 plate.
**/
function _getAllWellSetsForLabware (labwareName: string): ?WellSetByWell {
  const labware = getLabware(labwareName)

  if (!labware) {
    console.warn(`No labware definition found for labware ${labwareName}`)
    return null
  }

  const allWells = flatten(labware.ordering)
  const allWellSets: WellSetByWell = allWells.reduce((acc: WellSetByWell, well: string) => {
    const wellSet = computeWellAccess(labwareName, well)

    return (wellSet === null)
    ? acc
    : [...acc, wellSet]
  }, [])

  return allWellSets
}

export function getWellSetForMultichannel (labwareName: string, well: string): ?Array<string> {
  // Eg given well C2 for a 96 plate, returns ['A2', 'B2', ... 'H2'] (or null)
  const allWellSets = _getAllWellSetsForLabware(labwareName)
  if (!allWellSets) {
    return null
  }

  return allWellSets.find((wellSet: Array<string>) => wellSet.includes(well))
}
