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
import uniq from 'lodash/uniq'

import { getWellNamePerMultiTip } from './getWellNamePerMultiTip'
import { get96Channel384WellPlateWells, getLabwareDefURI, orderWells } from '.'
import type { LabwareDefinition2, PipetteNameSpecs } from '../types'

type WellSetByPrimaryWell = string[][]

// Compute all well sets for a labware def (non-memoized)
function _getAllWellSetsForLabware(
  labwareDef: LabwareDefinition2,
  channels: 8 | 96
): WellSetByPrimaryWell {
  const allWells: string[] = Object.keys(labwareDef.wells)

  return allWells.reduce(
    (acc: WellSetByPrimaryWell, well: string): WellSetByPrimaryWell => {
      const wellSet = getWellNamePerMultiTip(labwareDef, well, 8)
      if (wellSet === null) {
        return acc
      } else {
        return [...acc, wellSet]
      }
    },
    []
  )
}

// creates memoized getAllWellSetsForLabware + getWellSetForMultichannel fns.
export interface WellSetHelpers {
  getAllWellSetsForLabware: (
    labwareDef: LabwareDefinition2,
    channels: 8 | 96
  ) => WellSetByPrimaryWell

  getWellSetForMultichannel: (
    labwareDef: LabwareDefinition2,
    well: string,
    channels: 8 | 96
  ) => string[] | null | undefined

  canPipetteUseLabware: (
    pipetteSpec: PipetteNameSpecs,
    labwareDef: LabwareDefinition2
  ) => boolean
}

export const makeWellSetHelpers = (): WellSetHelpers => {
  const cache: Partial<{
    [labwareDefURI: string]: {
      labwareDef: LabwareDefinition2
      wellSetByPrimaryWell: WellSetByPrimaryWell
    } | null
  }> = {}

  const getAllWellSetsForLabware = (
    labwareDef: LabwareDefinition2,
    channels: 8 | 96
  ): WellSetByPrimaryWell => {
    const labwareDefURI = getLabwareDefURI(labwareDef)
    const c = cache[labwareDefURI]

    // use cached version only if labwareDef is shallowly equal, in case
    // custom labware defs are changed without giving them a new URI
    if (c && c.labwareDef === labwareDef) {
      return c.wellSetByPrimaryWell
    }

    const wellSetByPrimaryWell = _getAllWellSetsForLabware(labwareDef, channels)

    cache[labwareDefURI] = {
      labwareDef,
      wellSetByPrimaryWell,
    }
    return wellSetByPrimaryWell
  }

  const getWellSetForMultichannel = (
    labwareDef: LabwareDefinition2,
    well: string,
    channels: 8 | 96
  ): string[] | null | undefined => {
    /** Given a well for a labware, returns the well set it belongs to (or null)
     * for 8-channel access.
     * Ie: C2 for 96-flat => ['A2', 'B2', 'C2', ... 'H2']
     * Or A1 for trough => ['A1', 'A1', 'A1', ...]
     **/
    const allWellSetsFor8Channel = getAllWellSetsForLabware(
      labwareDef,
      channels
    )
    /**  getting all wells from the plate and turning into 1D array for 96-channel
     */
    const orderedWellsFor96Channel = orderWells(
      labwareDef.ordering,
      't2b',
      'l2r'
    )

    let ninetySixChannelWells = orderedWellsFor96Channel
    /**  special casing 384 well plates to be every other well
     * both on the x and y ases.
     */
    if (orderedWellsFor96Channel.length === 384) {
      ninetySixChannelWells = get96Channel384WellPlateWells(
        orderedWellsFor96Channel,
        well
      )
    }
    return channels === 8
      ? allWellSetsFor8Channel.find((wellSet: string[]) =>
          wellSet.includes(well)
        )
      : ninetySixChannelWells
  }

  const canPipetteUseLabware = (
    pipetteSpec: PipetteNameSpecs,
    labwareDef: LabwareDefinition2
  ): boolean => {
    if (pipetteSpec.channels === 1) {
      // assume all labware can be used by single-channel
      return true
    }

    const allWellSets = getAllWellSetsForLabware(labwareDef, 8)
    return allWellSets.some(wellSet => {
      const uniqueWells = uniq(wellSet)
      // if all wells are non-null, and there are either 1 (reservoir-like)
      // or 8 (well plate-like) unique wells in the set,
      // then assume both 8 and 96 channel pipettes will work
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
