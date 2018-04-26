// @flow
import flatten from 'lodash/flatten'
import memoize from 'lodash/memoize'
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

/** Memoize _getAllWellSetsForLabware so well sets don't need to be computed
  * for the same labware more than once.
  * NOTE: This assumes labware definitions are static. Custom labware must
  * somehow invalidate this cache.
**/
const _getAllWellSetsForLabwareMemoized = memoize(_getAllWellSetsForLabware)

function _getWellSetForMultichannel (labwareName: string, well: string): ?Array<string> {
  /** Given a well for a labware, returns the well set it belongs to (or null)
    * for 8-channel access.
    * Ie: C2 for 96-flat => ['A2', 'B2', 'C2', ... 'H2']
  **/
  const allWellSets = _getAllWellSetsForLabwareMemoized(labwareName)
  if (!allWellSets) {
    return null
  }

  return allWellSets.find((wellSet: Array<string>) => wellSet.includes(well))
}

export const getWellSetForMultichannel = memoize(
  _getWellSetForMultichannel,
  (labwareName: string, well: string) => `$LABWARE:${labwareName}--WELL:${well}`
)
