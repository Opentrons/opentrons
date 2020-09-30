// @flow
// A "well set" is an array of wells corresponding to each tip of an 8 channel pipette.
// Eg ['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1'] is a well set in a 384 plate.
//
// A trough-like well that encompasses all 8 tips at once has a well set
//  ['A1', 'A1', 'A1', 'A1', 'A1', 'A1', 'A1', 'A1']
//
// Well sets are determined by geometry.
//
// Labware with multiple positions for an 8-channel pipette have multiple well sets.
// For example, a 96 plate has 12 well sets, one for each column.
// A 384 plate has 48 well sets, 2 for each column b/c it has staggered columns.
//
// If a labware has no possible well sets, then it is not compatible with multi-channel pipettes.
import { getLabwareDefURI } from '@opentrons/shared-data'
import uniq from 'lodash/uniq'
import { getWellNamePerMultiTip } from './getWellNamePerMultiTip'
import type { LabwareDefinition2, PipetteNameSpecs } from '../types'

type WellSetByPrimaryWell = Array<Array<string>>

// Compute all well sets for a labware def (non-memoized)
function _getAllWellSetsForLabware(
  labwareDef: LabwareDefinition2
): WellSetByPrimaryWell {
  const allWells: Array<string> = Object.keys(labwareDef.wells)
  return allWells.reduce(
    (acc: WellSetByPrimaryWell, well: string): WellSetByPrimaryWell => {
      const wellSet = getWellNamePerMultiTip(labwareDef, well)
      return wellSet === null ? acc : [...acc, wellSet]
    },
    []
  )
}

// creates memoized getAllWellSetsForLabware + getWellSetForMultichannel fns.
export type WellSetHelpers = {|
  getAllWellSetsForLabware: (
    labwareDef: LabwareDefinition2
  ) => WellSetByPrimaryWell,
  getWellSetForMultichannel: (
    labwareDef: LabwareDefinition2,
    well: string
  ) => ?Array<string>,
  canPipetteUseLabware: (
    pipetteSpec: PipetteNameSpecs,
    labwareDef: LabwareDefinition2
  ) => boolean,
|}
export const makeWellSetHelpers = (): WellSetHelpers => {
  const cache: {
    [labwareDefURI: string]: ?{|
      labwareDef: LabwareDefinition2,
      wellSetByPrimaryWell: WellSetByPrimaryWell,
    |},
    ...,
  } = {}

  const getAllWellSetsForLabware = (
    labwareDef: LabwareDefinition2
  ): WellSetByPrimaryWell => {
    const labwareDefURI = getLabwareDefURI(labwareDef)
    const c = cache[labwareDefURI]
    // use cached version only if labwareDef is shallowly equal, in case
    // custom labware defs are changed without giving them a new URI
    if (c && c.labwareDef === labwareDef) {
      return c.wellSetByPrimaryWell
    }
    const wellSetByPrimaryWell = _getAllWellSetsForLabware(labwareDef)
    cache[labwareDefURI] = { labwareDef, wellSetByPrimaryWell }
    return wellSetByPrimaryWell
  }

  const getWellSetForMultichannel = (
    labwareDef: LabwareDefinition2,
    well: string
  ): ?Array<string> => {
    /** Given a well for a labware, returns the well set it belongs to (or null)
     * for 8-channel access.
     * Ie: C2 for 96-flat => ['A2', 'B2', 'C2', ... 'H2']
     * Or A1 for trough => ['A1', 'A1', 'A1', ...]
     **/
    const allWellSets = getAllWellSetsForLabware(labwareDef)
    return allWellSets.find((wellSet: Array<string>) => wellSet.includes(well))
  }

  const canPipetteUseLabware = (
    pipetteSpec: PipetteNameSpecs,
    labwareDef: LabwareDefinition2
  ): boolean => {
    if (pipetteSpec.channels === 1) {
      // assume all labware can be used by single-channel
      return true
    }

    const allWellSets = getAllWellSetsForLabware(labwareDef)
    return allWellSets.some(wellSet => {
      const uniqueWells = uniq(wellSet)
      // if all wells are non-null, and there are either 1 (reservoir-like)
      // or 8 (well plate-like) unique wells in the set,
      // then assume multi-channel will work
      return (
        uniqueWells.every(well => well != null) &&
        [1, 8].includes(uniqueWells.length)
      )
    })
  }

  return {
    getAllWellSetsForLabware,
    getWellSetForMultichannel,
    canPipetteUseLabware,
  }
}
