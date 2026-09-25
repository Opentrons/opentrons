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

import { get96Channel384WellPlateWells, getLabwareDefURI, orderWells } from '.'
import { ROW, SINGLE } from '../../command/types'
import {
  getWellNamePerMultiTip,
  getWellNamePerRowMultiTip,
} from './getWellNamePerMultiTip'

import type { NozzleConfigurationStyle } from '../../command/types'
import type {
  ActiveNozzleNumber,
  LabwareDefinition,
  NozzleLayoutConfig,
  PipetteV2Specs,
} from '../types'

type WellSetByPrimaryWell = string[][]

const VALID_COLUMN_WELL_SET_SIZES = [1, 8] as const
const VALID_ROW_WELL_SET_SIZES = [1, 12] as const

function isValidWellSet(
  wellSet: string[],
  validUniqueCounts: readonly number[]
): boolean {
  const uniqueWells = uniq(wellSet)
  return (
    uniqueWells.every(well => well != null) &&
    validUniqueCounts.includes(uniqueWells.length)
  )
}

// Compute all well sets for a labware def (non-memoized)
function _getAllWellSetsForLabware(
  labwareDef: LabwareDefinition
): WellSetByPrimaryWell {
  const allWells: string[] = Object.keys(labwareDef.wells)
  const wellSets: WellSetByPrimaryWell = []

  for (const well of allWells) {
    const wellSet = getWellNamePerMultiTip(labwareDef, well, 8)
    if (wellSet != null) {
      wellSets.push(wellSet)
    }
  }

  return wellSets
}

function _getAllRowWellSetsForLabware(
  labwareDef: LabwareDefinition
): WellSetByPrimaryWell {
  const allWells: string[] = Object.keys(labwareDef.wells)
  const wellSets: WellSetByPrimaryWell = []

  for (const well of allWells) {
    const wellSet = getWellNamePerRowMultiTip(labwareDef, well)
    if (wellSet != null) {
      wellSets.push(wellSet)
    }
  }

  return wellSets
}

export interface NozzleLayoutDetails {
  nozzleConfig: NozzleLayoutConfig
  /* The number of nozzles actively used by the pipette in the current configuration.
   * Ex, if a 96-channel uses a column config, this will be 8.
   * */
  activeNozzleCount: number
}

export interface WellSetForMultiChannelParams {
  labwareDef: LabwareDefinition
  wellName: string
  channels: ActiveNozzleNumber
  pipetteNozzleDetails?: NozzleLayoutDetails
}

// creates memoized getAllWellSetsForLabware + getWellSetForMultichannel fns.
export interface WellSetHelpers {
  getAllWellSetsForLabware: (
    labwareDef: LabwareDefinition
  ) => WellSetByPrimaryWell

  /** Given a well for a labware, returns the well set it belongs to (or null)
   * for 8-channel and 96-channel access.
   * Ex: C2 for 96-flat => ['A2', 'B2', 'C2', ... 'H2']
   * Or A1 for trough => ['A1', 'A1', 'A1', ...]
   *
   * @param {string[] | undefined} pipetteNozzleDetails If specified, return only the wells utilized by the active pipette
   * nozzle configuration.
   **/
  getWellSetForMultichannel: (
    params: WellSetForMultiChannelParams
  ) => string[] | null | undefined

  canPipetteUseLabware: (
    pipetteSpec: PipetteV2Specs,
    nozzleConfiguration: NozzleConfigurationStyle,
    labwareDef?: LabwareDefinition,
    trashName?: string
  ) => boolean
}

export const makeWellSetHelpers = (): WellSetHelpers => {
  const cache: Partial<{
    [labwareDefURI: string]: {
      labwareDef: LabwareDefinition
      wellSetByPrimaryWell: WellSetByPrimaryWell
    } | null
  }> = {}

  const getAllWellSetsForLabware = (
    labwareDef: LabwareDefinition
  ): WellSetByPrimaryWell => {
    const labwareDefURI = getLabwareDefURI(labwareDef)
    const c = cache[labwareDefURI]

    // use cached version only if labwareDef is shallowly equal, in case
    // custom labware defs are changed without giving them a new URI
    if (c && c.labwareDef === labwareDef) {
      return c.wellSetByPrimaryWell
    }

    const wellSetByPrimaryWell = _getAllWellSetsForLabware(labwareDef)

    cache[labwareDefURI] = {
      labwareDef,
      wellSetByPrimaryWell,
    }
    return wellSetByPrimaryWell
  }

  // TODO(jh 10-10-24): The partial tip logic is strongly coupled to lower-level partial tip API changes.
  //  Consider alternative methods for deriving well sets when in partial nozzle configurations.
  const getWellSetForMultichannel = ({
    labwareDef,
    wellName,
    channels,
    pipetteNozzleDetails,
  }: WellSetForMultiChannelParams): string[] | null => {
    // If the nozzle config isn't specified, assume the "full" config.
    const nozzleConfig = pipetteNozzleDetails?.nozzleConfig ?? null

    const getActiveRowFromWell = (wellSet: WellSetByPrimaryWell): string[] => {
      const rowLetter = wellName.slice(0, 1)
      // A = 0, B = 1, Z = 25, etc.
      const rowIndex = rowLetter.toUpperCase().charCodeAt(0) - 65

      return wellSet.map(columnOfWells => columnOfWells[rowIndex])
    }

    const get8ChPartialColumnFromWell = (
      wellSet: WellSetByPrimaryWell
    ): string[] => {
      const activeNozzleCount = pipetteNozzleDetails?.activeNozzleCount ?? 0

      // Find the column that contains the given well.
      const targetColumn = wellSet.find(column => column.includes(wellName))
      if (targetColumn == null || activeNozzleCount === 0) {
        return []
      }

      const wellIndex = targetColumn.indexOf(wellName)

      // If there are fewer wells than active nozzles, only select as many wells as there are nozzles.
      return targetColumn.slice(
        Math.max(wellIndex - activeNozzleCount + 1, 0),
        wellIndex + 1
      )
    }

    if (channels === 8) {
      const allWellSetsFor8Channel = getAllWellSetsForLabware(labwareDef)
      switch (nozzleConfig) {
        case null:
        case 'full':
        case 'column': {
          if (
            pipetteNozzleDetails == null ||
            pipetteNozzleDetails.activeNozzleCount === 8
          ) {
            return (
              allWellSetsFor8Channel.find((wellSet: string[]) =>
                wellSet.includes(wellName)
              ) ?? null
            )
          } else {
            return get8ChPartialColumnFromWell(allWellSetsFor8Channel)
          }
        }
        case 'single':
          return [wellName]
        case 'row':
        case 'subrect':
        default:
          console.error('Unhandled nozzleConfig case.')
          return null
      }
    } else if (channels === 12) {
      return getActiveRowFromWell(labwareDef.ordering)
    } else if (channels > 1 && channels < 8) {
      const flatListOfWells = labwareDef.ordering.flat()
      const allWellSetsFor8Channel = getAllWellSetsForLabware(labwareDef)
      const partialWellIndex = allWellSetsFor8Channel.flat().indexOf(wellName)
      return flatListOfWells.slice(
        partialWellIndex,
        partialWellIndex + channels
      )
    } else {
      switch (nozzleConfig) {
        case null:
        case 'full': {
          /**  getting all wells from the plate and turning into 1D array for 96-channel
           */
          const orderedWellsFor96Channel = orderWells(
            labwareDef.ordering,
            't2b',
            'l2r'
          )
          /**  special casing 384 well plates to be every other well
           * both on the x and y ases.
           */
          return orderedWellsFor96Channel.length === 384
            ? get96Channel384WellPlateWells(orderedWellsFor96Channel, wellName)
            : orderedWellsFor96Channel
        }
        case 'single':
          return [wellName]
        case 'column':
          return (
            labwareDef.ordering.find((wellSet: string[]) =>
              wellSet.includes(wellName)
            ) ?? null
          )
        case 'row':
          return getActiveRowFromWell(labwareDef.ordering)
        case 'subrect':
        default:
          console.error('Unhandled nozzleConfig case.')
          return null
      }
    }
  }

  const hasValidColumnWellSets = (labwareDef: LabwareDefinition): boolean => {
    const allWellSets = getAllWellSetsForLabware(labwareDef)
    return allWellSets.some(wellSet =>
      isValidWellSet(wellSet, VALID_COLUMN_WELL_SET_SIZES)
    )
  }

  const hasValidRowWellSets = (labwareDef: LabwareDefinition): boolean => {
    const allRowWellSets = _getAllRowWellSetsForLabware(labwareDef)
    return allRowWellSets.some(wellSet =>
      isValidWellSet(wellSet, VALID_ROW_WELL_SET_SIZES)
    )
  }

  const canPipetteUseLabware = (
    pipetteSpec: PipetteV2Specs,
    nozzleConfiguration: NozzleConfigurationStyle,
    labwareDef?: LabwareDefinition,
    trashName?: string
  ): boolean => {
    const has1ActiveNozzle =
      pipetteSpec.channels === 1 || nozzleConfiguration === SINGLE
    if (has1ActiveNozzle || trashName != null) {
      // assume all labware can be used by single-channel
      return true
    }
    if (labwareDef == null) {
      return false
    }

    // row tips span X. Use row geometry so row troughs (ex 8-well reservoirs
    // with centerMultichannelOnWells) are not judged by column Y spacing.
    if (nozzleConfiguration === ROW) {
      return hasValidRowWellSets(labwareDef)
    }

    // column/partial column/full multi: tips span Y.
    // full 96 nozzles still need Y-aligned wells... row-only troughs stay incompatible.
    return hasValidColumnWellSets(labwareDef)
  }
  return {
    getAllWellSetsForLabware,
    getWellSetForMultichannel,
    canPipetteUseLabware,
  }
}
