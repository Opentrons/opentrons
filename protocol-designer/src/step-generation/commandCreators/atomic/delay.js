// @flow
import type { PauseArgs, NextCommandCreator } from '../../types'

const delay: NextCommandCreator<PauseArgs> = (
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
