// @flow
import type { DelayParamsV3 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState, CommandCreator } from '../../types'

const delay = (args: DelayParamsV3): CommandCreator => (
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
