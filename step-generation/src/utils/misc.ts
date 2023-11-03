import assert from 'assert'
import flatMap from 'lodash/flatMap'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import {
  getIsTiprack,
  getLabwareDefURI,
  getWellsDepth,
  getWellNamePerMultiTip,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { blowout } from '../commandCreators/atomic/blowout'
import { curryCommandCreator } from './curryCommandCreator'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { BlowoutParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type {
  CurriedCommandCreator,
  InvariantContext,
  LabwareEntity,
  LocationLiquidState,
  PipetteEntity,
  RobotState,
  SourceAndDest,
} from '../types'
import { AdditionalEquipmentEntities } from '..'
export const AIR: '__air__' = '__air__'
export const SOURCE_WELL_BLOWOUT_DESTINATION: 'source_well' = 'source_well'
export const DEST_WELL_BLOWOUT_DESTINATION: 'dest_well' = 'dest_well'
export function repeatArray<T>(array: T[], repeats: number): T[] {
  return flatMap(range(repeats), (i: number): T[] => array)
}
interface Vol {
  volume: number
}

/** Total volume of a location ("air" is not included in the sum) */
export function getLocationTotalVolume(loc: LocationLiquidState): number {
  return reduce(
    loc,
    (acc: number, ingredState: Vol, ingredId: string) => {
      return ingredId === AIR ? acc : acc + ingredState.volume
    },
    0
  )
}

/** Breaks a liquid volume state into 2 parts. Assumes all liquids are evenly mixed. */
export function splitLiquid(
  volume: number,
  sourceLiquidState: LocationLiquidState
): SourceAndDest {
  const totalSourceVolume = getLocationTotalVolume(sourceLiquidState)

  if (totalSourceVolume === 0) {
    // Splitting from empty source
    return {
      source: sourceLiquidState,
      dest: {
        [AIR]: {
          volume,
        },
      },
    }
  }

  if (volume > totalSourceVolume) {
    // Take all of source, plus air
    return {
      source: mapValues(sourceLiquidState, () => ({
        volume: 0,
      })),
      dest: {
        ...sourceLiquidState,
        [AIR]: {
          volume: volume - totalSourceVolume,
        },
      },
    }
  }

  const ratios: Record<string, number> = reduce(
    sourceLiquidState,
    (acc: Record<string, number>, ingredState: Vol, ingredId: string) => ({
      ...acc,
      [ingredId]: ingredState.volume / totalSourceVolume,
    }),
    {}
  )
  return Object.keys(sourceLiquidState).reduce(
    (acc, ingredId) => {
      const destVol = ratios[ingredId] * volume
      return {
        source: {
          ...acc.source,
          [ingredId]: {
            volume: sourceLiquidState[ingredId].volume - destVol,
          },
        },
        dest: {
          ...acc.dest,
          [ingredId]: {
            volume: destVol,
          },
        },
      }
    },
    {
      source: {},
      dest: {},
    }
  )
}

/** The converse of splitLiquid. Adds all of one liquid to the other.
 * The args are called 'source' and 'dest', but here they're interchangable.
 */
export function mergeLiquid(
  source: LocationLiquidState,
  dest: LocationLiquidState
): LocationLiquidState {
  return {
    // include all ingreds exclusive to 'dest'
    ...dest,
    ...reduce<LocationLiquidState, LocationLiquidState>(
      source,
      (acc, ingredState: Vol, ingredId: string) => {
        const isCommonIngred = ingredId in dest
        const ingredVolume = isCommonIngred // sum volumes of ingredients common to 'source' and 'dest'
          ? ingredState.volume + dest[ingredId].volume // include all ingreds exclusive to 'source'
          : ingredState.volume
        return {
          ...acc,
          [ingredId]: {
            volume: ingredVolume,
          },
        }
      },
      {}
    ),
  }
}
// TODO: Ian 2019-04-19 move to shared-data helpers?
export function getWellsForTips(
  channels: 1 | 8 | 96,
  labwareDef: LabwareDefinition2,
  well: string
): {
  wellsForTips: string[]
  allWellsShared: boolean
} {
  // Array of wells corresponding to the tip at each position.
  const wellsForTips =
    channels === 1 ? [well] : getWellNamePerMultiTip(labwareDef, well, channels)

  if (!wellsForTips) {
    console.warn(
      channels === 1
        ? `Invalid well: ${well}`
        : `For labware def (URI ${getLabwareDefURI(
            labwareDef
          )}), with primary well ${well}, no wells are accessible by 8-channel's 1st tip`
    )
    // TODO: Ian 2019-04-11 figure out a clearer way to handle failure case
    return {
      wellsForTips: [],
      allWellsShared: false,
    }
  }

  // allWellsShared: eg in a trough, all wells are shared by an 8-channel
  // (for single-channel, "all wells" are always shared because there is only 1 well)
  // NOTE Ian 2018-03-15: there is no support for a case where some but not all wells are shared.
  // Eg, some unusual labware that allows 2 tips to a well will not work with the implementation below.
  // Low-priority TODO.
  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])
  return {
    wellsForTips,
    allWellsShared,
  }
}
// Set blowout location depending on the 'blowoutLocation' arg: set it to
// the SOURCE_WELL_BLOWOUT_DESTINATION / DEST_WELL_BLOWOUT_DESTINATION
// special strings, or to a labware ID.
export const blowoutUtil = (args: {
  pipette: BlowoutParams['pipette']
  sourceLabwareId: string
  sourceWell: BlowoutParams['well']
  destLabwareId: string
  destWell: BlowoutParams['well']
  blowoutLocation: string | null | undefined
  flowRate: number
  offsetFromTopMm: number
  invariantContext: InvariantContext
}): CurriedCommandCreator[] => {
  const {
    pipette,
    sourceLabwareId,
    sourceWell,
    destLabwareId,
    destWell,
    blowoutLocation,
    flowRate,
    offsetFromTopMm,
    invariantContext,
  } = args
  if (!blowoutLocation) return []
  let labware
  let well

  if (blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION) {
    labware = invariantContext.labwareEntities[sourceLabwareId]
    well = sourceWell
  } else if (blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION) {
    labware = invariantContext.labwareEntities[destLabwareId]
    well = destWell
  } else {
    // if it's not one of the magic strings, it's a labware id
    labware = invariantContext.labwareEntities?.[blowoutLocation]
    well = 'A1'

    if (!labware) {
      assert(
        false,
        `expected a labwareId for blowoutUtil's "blowoutLocation", got ${blowoutLocation}`
      )
      return []
    }
  }

  const offsetFromBottomMm =
    getWellsDepth(labware.def, [well]) + offsetFromTopMm
  return [
    curryCommandCreator(blowout, {
      pipette: pipette,
      labware: labware.id,
      well,
      flowRate,
      offsetFromBottomMm,
    }),
  ]
}
export function createEmptyLiquidState(
  invariantContext: InvariantContext
): RobotState['liquidState'] {
  const { labwareEntities, pipetteEntities } = invariantContext
  return {
    pipettes: reduce(
      pipetteEntities,
      (acc, pipette: PipetteEntity, id: string) => {
        const pipetteSpec = pipette.spec
        return { ...acc, [id]: createTipLiquidState(pipetteSpec.channels, {}) }
      },
      {}
    ),
    labware: reduce(
      labwareEntities,
      (acc, labware: LabwareEntity, id: string) => {
        return { ...acc, [id]: mapValues(labware.def.wells, () => ({})) }
      },
      {}
    ),
  }
}
export function createTipLiquidState<T>(
  channels: number,
  contents: T
): Record<string, T> {
  return range(channels).reduce(
    (tipIdAcc, tipId) => ({ ...tipIdAcc, [tipId]: contents }),
    {}
  )
}
// always return destination unless the blowout location is the source
export const getDispenseAirGapLocation = (args: {
  blowoutLocation: string | null | undefined
  sourceLabware: string
  destLabware: string
  sourceWell: string
  destWell: string
}): {
  dispenseAirGapLabware: string
  dispenseAirGapWell: string
} => {
  const {
    blowoutLocation,
    sourceLabware,
    destLabware,
    sourceWell,
    destWell,
  } = args
  return blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION
    ? {
        dispenseAirGapLabware: sourceLabware,
        dispenseAirGapWell: sourceWell,
      }
    : {
        dispenseAirGapLabware: destLabware,
        dispenseAirGapWell: destWell,
      }
}
// NOTE: pipettes have no tips, tiprack are full
export function makeInitialRobotState(args: {
  invariantContext: InvariantContext
  labwareLocations: RobotState['labware']
  moduleLocations: RobotState['modules']
  pipetteLocations: RobotState['pipettes']
}): RobotState {
  const {
    invariantContext,
    labwareLocations,
    moduleLocations = {},
    pipetteLocations,
  } = args
  return {
    labware: labwareLocations,
    modules: moduleLocations,
    pipettes: pipetteLocations,
    liquidState: createEmptyLiquidState(invariantContext),
    tipState: {
      pipettes: reduce(
        pipetteLocations,
        (acc, pipetteTemporalProperties, id) =>
          pipetteTemporalProperties.mount ? { ...acc, [id]: false } : acc,
        {}
      ),
      tipracks: reduce(
        labwareLocations,
        (acc, _, labwareId) => {
          const def = invariantContext.labwareEntities[labwareId].def
          if (!getIsTiprack(def)) return acc
          const tipState = mapValues(def.wells, () => true)
          return { ...acc, [labwareId]: tipState }
        },
        {}
      ),
    },
  }
}

export const getHasWasteChute = (
  additionalEquipmentEntities: AdditionalEquipmentEntities
): boolean => {
  return Object.values(additionalEquipmentEntities).some(
    additionalEquipmentEntity =>
      additionalEquipmentEntity.location === WASTE_CHUTE_CUTOUT &&
      additionalEquipmentEntity.name === 'wasteChute'
  )
}

export const getTiprackHasTips = (
  tipState: RobotState['tipState'],
  labwareId: string
): boolean => {
  return tipState.tipracks[labwareId] != null
    ? Object.values(tipState.tipracks[labwareId]).some(
        tipState => tipState === true
      )
    : false
}

export const getLabwareHasLiquid = (
  liquidState: RobotState['liquidState'],
  labwareId: string
): boolean => {
  return liquidState.labware[labwareId] != null
    ? Object.values(liquidState.labware[labwareId]).some(liquidState =>
        Object.values(liquidState).some(volume => volume.volume > 0)
      )
    : false
}
