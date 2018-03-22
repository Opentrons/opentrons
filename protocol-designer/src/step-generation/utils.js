// @flow
import cloneDeep from 'lodash/cloneDeep'
import flatMap from 'lodash/flatMap'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import {computeWellAccess} from '@opentrons/labware-definitions'
import type {CommandCreator, RobotState} from './types'

export function repeatArray<T> (array: Array<T>, repeats: number): Array<T> {
  return flatMap(range(repeats), (i: number): Array<T> => array)
}

// TODO Ian 2018-02-13: how should errors that happen in CommandCreators (eg, invalid previous state: no more tips) be handled?
/**
 * Take an array of CommandCreators, streaming robotState through them in order,
 * and adding each CommandCreator's commands to a single commands array.
 */
export const reduceCommandCreators = (commandCreators: Array<CommandCreator>): CommandCreator =>
  (prevRobotState: RobotState) => (
    commandCreators.reduce(
      (prev, reducerFn) => {
        const next = reducerFn(prev.robotState)
        return {
          robotState: next.robotState,
          commands: [...prev.commands, ...next.commands]
        }
      },
      {robotState: cloneDeep(prevRobotState), commands: []}
      // TODO: should I clone here (for safety) or is it safe enough?
      // Should I avoid cloning in the CommandCreators themselves and just do it pre-emptively in here?
    )
  )

type Vol = {volume: number}
type LiquidVolumeState = {[ingredGroup: string]: Vol}

export const AIR = '__air__'

/** Breaks a liquid volume state into 2 parts. Assumes all liquids are evenly mixed. */
export function splitLiquid (volume: number, sourceLiquidState: LiquidVolumeState): {
  source: LiquidVolumeState,
  dest: LiquidVolumeState
} {
  const totalSourceVolume = reduce(
    sourceLiquidState,
    (acc: number, ingredState: Vol, ingredId: string) => {
      // air is not included in the total volume
      return (ingredId === AIR)
        ? acc
        : acc + ingredState.volume
    },
    0
  )

  // TODO Ian 2018-03-19 figure out what to do with air warning reporting
  // if (AIR in sourceLiquidState) {
  //   console.warn('Splitting liquid with air present', sourceLiquidState)
  // }

  if (totalSourceVolume === 0) {
    // Splitting from empty source
    return {
      source: sourceLiquidState,
      dest: {[AIR]: {volume}}
    }
  }

  if (volume > totalSourceVolume) {
    // Take all of source, plus air
    return {
      source: mapValues(sourceLiquidState, () => ({volume: 0})),
      dest: {
        ...sourceLiquidState,
        [AIR]: {volume: volume - totalSourceVolume}
      }
    }
  }

  const ratios: {[ingredId: string]: number} = reduce(
    sourceLiquidState,
    (acc: {[ingredId: string]: number}, ingredState: Vol, ingredId: string) => ({
      ...acc,
      [ingredId]: ingredState.volume / totalSourceVolume
    })
  , {})

  return Object.keys(sourceLiquidState).reduce((acc, ingredId) => {
    const destVol = ratios[ingredId] * volume
    return {
      source: {
        ...acc.source,
        [ingredId]: {volume: sourceLiquidState[ingredId].volume - destVol}
      },
      dest: {
        ...acc.dest,
        [ingredId]: {volume: destVol}
      }
    }
  }, {source: {}, dest: {}})
}

/** The converse of splitLiquid. Adds all of one liquid to the other.
  * The args are called 'source' and 'dest', but here they're interchangable.
  */
export function mergeLiquid (source: LiquidVolumeState, dest: LiquidVolumeState): LiquidVolumeState {
  return {
    // include all ingreds exclusive to 'dest'
    ...dest,

    ...reduce(source, (acc: LiquidVolumeState, ingredState: Vol, ingredId: string) => {
      const isCommonIngred = ingredId in dest
      const ingredVolume = isCommonIngred
        // sum volumes of ingredients common to 'source' and 'dest'
        ? ingredState.volume + dest[ingredId].volume
        // include all ingreds exclusive to 'source'
        : ingredState.volume

      return {
        ...acc,
        [ingredId]: {volume: ingredVolume}
      }
    }, {})
  }
}

export function getWellsForTips (channels: 1 | 8, labwareType: string, well: string) {
  // Array of wells corresponding to the tip at each position.
  const wellsForTips = (channels === 1)
    ? [well]
    : computeWellAccess(labwareType, well)

  if (!wellsForTips) {
    throw new Error(channels === 1
      ? `Invalid well: ${well}`
      : `Labware type ${labwareType}, well ${well} is not accessible by 8-channel's 1st tip`
    )
  }

  // allWellsShared: eg in a trough, all wells are shared by an 8-channel
  // (for single-channel, "all wells" are always shared because there is only 1 well)
  // NOTE Ian 2018-03-15: there is no support for a case where some but not all wells are shared.
  // Eg, some unusual labware that allows 2 tips to a well will not work with the implementation below.
  // Low-priority TODO.
  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])

  return {wellsForTips, allWellsShared}
}
