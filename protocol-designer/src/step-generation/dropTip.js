// @flow
import type {CommandReducer, RobotState} from './'
import cloneDeep from 'lodash/cloneDeep'

export default function dropTip (pipetteId: string, robotState: RobotState): CommandReducer {
  // No-op if there is no tip
  if (robotState.tipState.pipettes[pipetteId] === false) {
    return {
      nextRobotState: robotState,
      nextCommands: []
    }
  }

  const nextRobotState: RobotState = cloneDeep(robotState)

  nextRobotState.tipState.pipettes[pipetteId] = false

  return ({
    nextRobotState,
    nextCommands: [
      {
        command: 'drop-tip',
        pipette: pipetteId,
        labware: 'trashId', // TODO Ian 2018-02-09 will we always have this trash in robotState? If so, put the ID in constants (or cooked into RobotState type itself).
        well: 'A1' // TODO: Is 'A1' of the trash always the right place to drop tips?
      }
    ]
  })
}
