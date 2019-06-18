// @flow
import type { DelayParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { InvariantContext, RobotState, CommandCreator } from '../../types'

const delay = (args: DelayParams): CommandCreator => (
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
