// @flow
import cloneDeep from 'lodash/cloneDeep'
import flatMap from 'lodash/flatMap'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import last from 'lodash/last'
import { computeWellAccess } from '@opentrons/shared-data'

import type {
  PipetteLabwareFieldsV1 as PipetteLabwareFields,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  LocationLiquidState,
  InvariantContext,
  RobotState,
  SourceAndDest,
  Timeline,
} from './types'
import blowout from './commandCreators/atomic/blowout'

import { AIR } from '@opentrons/components'
export { AIR }

export const SOURCE_WELL_BLOWOUT_DESTINATION: 'source_well' = 'source_well'
export const DEST_WELL_BLOWOUT_DESTINATION: 'dest_well' = 'dest_well'

export function repeatArray<T>(array: Array<T>, repeats: number): Array<T> {
  return flatMap(range(repeats), (i: number): Array<T> => array)
}

/**
 * Take an array of CommandCreators, streaming robotState through them in order,
 * and adding each CommandCreator's commands to a single commands array.
 */
export const reduceCommandCreators = (
  commandCreators: Array<CommandCreator>
): CommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  return commandCreators.reduce(
    (prev: $Call<CommandCreator, *, *>, reducerFn: CommandCreator, stepIdx) => {
      if (prev.errors) {
        // if there are errors, short-circuit the reduce
        return prev
      }
      const next = reducerFn(invariantContext, prev.robotState)
      if (next.errors) {
        return {
          robotState: prev.robotState,
          commands: prev.commands,
          errors: next.errors,
          errorStep: stepIdx,
          warnings: prev.warnings,
        }
      }
      return {
        robotState: next.robotState,
        commands: [...prev.commands, ...next.commands],
        warnings: [...(prev.warnings || []), ...(next.warnings || [])],
      }
    },
    { robotState: cloneDeep(prevRobotState), commands: [] }
    // TODO: should I clone here (for safety) or is it safe enough?
    // Should I avoid cloning in the CommandCreators themselves and just do it pre-emptively in here?
  )
}

export const commandCreatorsTimeline = (
  commandCreators: Array<CommandCreator>
) => (
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): Timeline => {
  console.log({ initialRobotState })
  const timeline = commandCreators.reduce(
    (acc: Timeline, commandCreator: CommandCreator, index: number) => {
      const prevRobotState =
        acc.timeline.length === 0
          ? initialRobotState
          : last(acc.timeline).robotState

      if (acc.errors) {
        // error short-circuit
        return acc
      }

      const nextResult = commandCreator(invariantContext, prevRobotState)

      if (nextResult.errors) {
        return {
          timeline: acc.timeline,
          errors: nextResult.errors,
        }
      }

      return {
        timeline: [...acc.timeline, nextResult],
        errors: null,
      }
    },
    { timeline: [], errors: null }
  )

  return {
    timeline: timeline.timeline,
    errors: timeline.errors,
  }
}

type Vol = { volume: number }

export function getLocationTotalVolume(loc: LocationLiquidState): number {
  return reduce(
    loc,
    (acc: number, ingredState: Vol, ingredId: string) => {
      // air is not included in the total volume
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
      dest: { [AIR]: { volume } },
    }
  }

  if (volume > totalSourceVolume) {
    // Take all of source, plus air
    return {
      source: mapValues(sourceLiquidState, () => ({ volume: 0 })),
      dest: {
        ...sourceLiquidState,
        [AIR]: { volume: volume - totalSourceVolume },
      },
    }
  }

  const ratios: { [ingredId: string]: number } = reduce(
    sourceLiquidState,
    (
      acc: { [ingredId: string]: number },
      ingredState: Vol,
      ingredId: string
    ) => ({
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
          [ingredId]: { volume: sourceLiquidState[ingredId].volume - destVol },
        },
        dest: {
          ...acc.dest,
          [ingredId]: { volume: destVol },
        },
      }
    },
    { source: {}, dest: {} }
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

    ...reduce(
      source,
      (acc: LocationLiquidState, ingredState: Vol, ingredId: string) => {
        const isCommonIngred = ingredId in dest
        const ingredVolume = isCommonIngred
          ? // sum volumes of ingredients common to 'source' and 'dest'
            ingredState.volume + dest[ingredId].volume
          : // include all ingreds exclusive to 'source'
            ingredState.volume

        return {
          ...acc,
          [ingredId]: { volume: ingredVolume },
        }
      },
      {}
    ),
  }
}

type WellsForTips = {
  wellsForTips: Array<string>,
  allWellsShared: boolean,
}

// TODO IMMEDIATELY: move to shared-data helpers
export function getWellsForTips(
  channels: 1 | 8,
  labwareDef: LabwareDefinition2,
  well: string
): WellsForTips {
  // Array of wells corresponding to the tip at each position.
  const wellsForTips =
    channels === 1 ? [well] : computeWellAccess(labwareDef, well)

  if (!wellsForTips) {
    console.warn(
      channels === 1
        ? `Invalid well: ${well}`
        : `For labware def (ID ${
            labwareDef.otId
          }), with primary well ${well}, no wells are accessible by 8-channel's 1st tip`
    )
    // TODO: Ian 2019-04-11 figure out a clearer way to handle failure case
    return { wellsForTips: [], allWellsShared: false }
  }

  // allWellsShared: eg in a trough, all wells are shared by an 8-channel
  // (for single-channel, "all wells" are always shared because there is only 1 well)
  // NOTE Ian 2018-03-15: there is no support for a case where some but not all wells are shared.
  // Eg, some unusual labware that allows 2 tips to a well will not work with the implementation below.
  // Low-priority TODO.
  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])

  return { wellsForTips, allWellsShared }
}

/** Total volume of a location (air is not included in the sum) */
export function totalVolume(location: LocationLiquidState): number {
  return Object.keys(location).reduce((acc, ingredId) => {
    return ingredId !== AIR ? acc + (location[ingredId].volume || 0) : acc
  }, 0)
}

export const blowoutUtil = (
  pipette: $PropertyType<PipetteLabwareFields, 'pipette'>,
  sourceLabware: $PropertyType<PipetteLabwareFields, 'labware'>,
  sourceWell: $PropertyType<PipetteLabwareFields, 'well'>,
  destLabware: $PropertyType<PipetteLabwareFields, 'labware'>,
  destWell: $PropertyType<PipetteLabwareFields, 'well'>,
  blowoutLocation: ?string
): Array<CommandCreator> => {
  if (!blowoutLocation) return []
  let labware = blowoutLocation
  let well = 'A1'

  // TODO Ian 2018-05-04 more explicit test for non-trash blowout destination
  if (blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION) {
    labware = sourceLabware
    well = sourceWell
  } else if (blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION) {
    labware = destLabware
    well = destWell
  }
  return [blowout({ pipette: pipette, labware, well })]
}
