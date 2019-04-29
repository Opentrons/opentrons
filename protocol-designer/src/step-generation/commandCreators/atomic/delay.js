// @flow
import type {
  DelayArgs,
  InvariantContext,
  RobotState,
  CommandCreator,
} from '../../types'

const delay = (args: DelayArgs): CommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  return {
    robotState: prevRobotState,
    commands: [
      {
        command: 'delay',
        params: {
          message: args.message,
          wait: args.wait,
        },
      },
    ],
  }
}

export default delay
