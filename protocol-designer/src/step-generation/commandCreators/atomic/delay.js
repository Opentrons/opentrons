// @flow
import type { PauseArgs, CommandCreator } from '../../types'

const delay: CommandCreator<PauseArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
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
