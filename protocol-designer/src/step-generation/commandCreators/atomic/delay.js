// @flow
import type {DelayArgs, RobotState, CommandCreator} from '../../types'

const delay = (args: DelayArgs): CommandCreator => (prevRobotState: RobotState) => {
  return {
    robotState: prevRobotState,
    commands: [{
      command: 'delay',
      params: {
        message: args.message,
        wait: args.wait,
      },
    }],
  }
}

export default delay
