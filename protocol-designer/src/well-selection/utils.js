// @flow
import flatten from 'lodash/flatten'
import memoize from 'lodash/memoize'
import {
  computeWellAccess,
  computeWellAccessDeprecated,
  getLabware,
} from '@opentrons/shared-data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { Wells } from '../labware-ingred/types'

type WellSetByWell = Array<Array<string>>

/** Compute all well sets for a labware type.
 * A well set is array of 8 wells that an 8 channel pipettes can fit into,
 * eg ['A1', 'C1', 'D1', 'E1', 'G1', 'I1', 'K1', 'M1'] is a well set in a 384 plate.
 **/
function _getAllWellSetsForLabwareDeprecated(
  labwareName: string
): ?WellSetByWell {
  const labware = getLabware(labwareName)

  if (!labware) {
    console.warn(`No labware definition found for labware ${labwareName}`)
    return null
  }

  const allWells = flatten(labware.ordering)
  const allWellSets: WellSetByWell = allWells.reduce(
    (acc: WellSetByWell, well: string) => {
      const wellSet = computeWellAccessDeprecated(labwareName, well)

      return wellSet === null ? acc : [...acc, wellSet]
    },
    []
  )

  return allWellSets
}

/** Memoize _getAllWellSetsForLabware so well sets don't need to be computed
 * for the same labware more than once.
 * NOTE: This assumes labware definitions are static. Custom labware must
 * somehow invalidate this cache.
 **/
const _getAllWellSetsForLabwareMemoizedDeprecated = memoize(
  _getAllWellSetsForLabwareDeprecated
)

function _getWellSetForMultichannelDeprecated(
  labwareName: string,
  well: string
): ?Array<string> {
  /** Given a well for a labware, returns the well set it belongs to (or null)
   * for 8-channel access.
   * Ie: C2 for 96-flat => ['A2', 'B2', 'C2', ... 'H2']
   **/
  const allWellSets = _getAllWellSetsForLabwareMemoizedDeprecated(labwareName)
  if (!allWellSets) {
    return null
  }

  return allWellSets.find((wellSet: Array<string>) => wellSet.includes(well))
}

export const getWellSetForMultichannelDeprecated = memoize(
  _getWellSetForMultichannelDeprecated,
  (labwareName: string, well: string) => `$LABWARE:${labwareName}--WELL:${well}`
)

/** Compute all well sets for a labware type.
 * A well set is array of 8 wells that an 8 channel pipettes can fit into,
 * eg ['A1', 'C1', 'D1', 'E1', 'G1', 'I1', 'K1', 'M1'] is a well set in a 384 plate.
 **/
function _getAllWellSetsForLabware(
  labwareDef: LabwareDefinition2
): WellSetByWell {
  const allWells: Array<string> = Object.keys(labwareDef.wells)
  return allWells.reduce((acc: WellSetByWell, well: string): WellSetByWell => {
    const wellSet = computeWellAccess(labwareDef, well)
    return wellSet === null ? acc : [...acc, wellSet]
  }, [])
}

let cache: {
  [otId: string]: ?{
    labwareDef: LabwareDefinition2,
    wellSetByWell: WellSetByWell,
  },
} = {}
const _getAllWellSetsForLabwareMemoized = (
  labwareDef: LabwareDefinition2
): WellSetByWell => {
  const c = cache[labwareDef.otId]
  // use cached version only if labwareDef is shallowly equal, in case
  // custom labware defs are changed without giving them a new otId
  if (c && c.labwareDef === labwareDef) {
    return c.wellSetByWell
  }
  const wellSetByWell = _getAllWellSetsForLabware(labwareDef)
  cache[labwareDef.otId] = { labwareDef, wellSetByWell }
  return wellSetByWell
}

export function getWellSetForMultichannel(
  labwareDef: LabwareDefinition2,
  well: string
): ?Array<string> {
  /** Given a well for a labware, returns the well set it belongs to (or null)
   * for 8-channel access.
   * Ie: C2 for 96-flat => ['A2', 'B2', 'C2', ... 'H2']
   **/
  const allWellSets = _getAllWellSetsForLabwareMemoized(labwareDef)
  return allWellSets.find((wellSet: Array<string>) => wellSet.includes(well))
}

export function wellSetToWellObj(wellSet: ?Array<string>): Wells {
  return wellSet
    ? wellSet.reduce(
        (acc: Wells, well: string) => ({ ...acc, [well]: well }),
        {}
      )
    : {}
}
