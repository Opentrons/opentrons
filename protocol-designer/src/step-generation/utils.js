// @flow
import cloneDeep from 'lodash/cloneDeep'
import flatMap from 'lodash/flatMap'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
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

// TODO Ian 2018-03-15 use Symbol, or other way to ensure no conflict with ingredGroupId keys?
// However, Flow doesn't like Symbol keys.
// (this conflict is unlikely, since ingredGroupIds are strings of numbers)
export const AIR = 'air'

/** Breaks a liquid volume state into 2 parts. Assumes all liquids are evenly mixed. */
export function splitLiquid (volume: number, sourceLiquidState: LiquidVolumeState): {
  source: LiquidVolumeState,
  dest: LiquidVolumeState
} {
  const totalSourceVolume = reduce(
    sourceLiquidState,
    (acc: number, ingredState: Vol) => acc + ingredState.volume,
    0
  )

  if (AIR in sourceLiquidState) {
    throw new Error(`Invalid source liquid state: source cannot contain air (key '${AIR}' cannot exist in sourceLiquidState object)`)
  }

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
