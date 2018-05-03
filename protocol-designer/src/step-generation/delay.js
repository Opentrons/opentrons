// @flow
import type {PauseFormData, RobotState, CommandCreator} from './'

const pause = (data: PauseFormData): CommandCreator => (prevRobotState: RobotState) => {
  return {
    robotState: prevRobotState,
    commands: [{
      command: 'delay',
      message: data.message,
      wait: data.wait
    }]
  }
}

export default pause
