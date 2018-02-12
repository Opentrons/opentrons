// @flow
import cloneDeep from 'lodash/cloneDeep'
import type {ConsolidateFormData, RobotState, CommandReducer} from './'

export default function consolidate (data: ConsolidateFormData, robotState: RobotState): CommandReducer {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.

    If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.

    A single uniform volume will be aspirated from every source well.
  */
  const nextRobotState = cloneDeep(robotState)
  let nextCommands = []

  // TODO IMMEDIATELY

  return {
    nextRobotState,
    nextCommands
  }
}

// return { // TODO: figure out where outside consolidate this annotation happens
//   robotState: nextRobotState,
//   atomicCommands: {
//     annotation: {
//       name: data.name,
//       description: data.description
//     },
//     commands
//   }
// }
