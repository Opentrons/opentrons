// @flow
import type {CommandReducer, RobotState} from './'
import cloneDeep from 'lodash/cloneDeep'

const dropTip = (pipetteId: string): CommandReducer => (robotState: RobotState) => {
  // No-op if there is no tip
  if (robotState.tipState.pipettes[pipetteId] === false) {
    return {
      robotState,
      commands: []
    }
  }

  const nextRobotState: RobotState = cloneDeep(robotState)

  nextRobotState.tipState.pipettes[pipetteId] = false

  return ({
    robotState: nextRobotState,
    commands: [
      {
        command: 'drop-tip',
        pipette: pipetteId,
        labware: 'trashId', // TODO Ian 2018-02-09 will we always have this trash in robotState? If so, put the ID in constants (or cooked into RobotState type itself).
        well: 'A1' // TODO: Is 'A1' of the trash always the right place to drop tips?
      }
    ]
  })
}

export default dropTip
