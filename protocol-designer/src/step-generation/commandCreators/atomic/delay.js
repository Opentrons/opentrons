// @flow
import type { PauseArgs, CommandCreator } from '../../types'

export const delay: CommandCreator<PauseArgs> = (
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
