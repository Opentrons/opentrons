// @flow
import type { DelayArgsV3 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState, CommandCreator } from '../../types'

const delay = (args: DelayArgsV3): CommandCreator => (
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
