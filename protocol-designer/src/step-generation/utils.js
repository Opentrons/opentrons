// @flow
import cloneDeep from 'lodash/cloneDeep'
import flatMap from 'lodash/flatMap'
import range from 'lodash/range'
import type {CommandReducer, RobotState} from './types'

// TODO IMMEDIATELY: Test
export function repeatArray<T> (array: Array<T>, repeats: number): Array<T> {
  return flatMap(range(repeats), (i: number): Array<T> => array)
}

// TODO IMMEDIATELY: Test
// TODO IMMEDIATELY: how should errors that happen in CommandReducers (eg, invalid previous state: no more tips) be handled?
/**
 * Take an array of CommandReducers, streaming robotState through them in order,
 * and adding each CommandReducer's commands to a single commands array.
 */
export const reduceCommandCreators = (commandCreators: Array<CommandReducer>): CommandReducer =>
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
      // Should I avoid cloning in the CommandReducers themselves and just do it pre-emptively in here?
    )
  )
