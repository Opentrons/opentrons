import { uuid } from '../../utils'
// TODO(mc, 2022-06-21): replace with `waitForResume` and `waitForDuration`
import type { PauseArgs, CommandCreator } from '../../types'
export const delay: CommandCreator<PauseArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const messageParam = args.message == null ? {} : { message: args.message }
  const waitForParam: { waitForResume: true } | { seconds: number } =
    args.wait === true ? { waitForResume: true } : { seconds: args.wait }

  return {
    commands: [
      {
        commandType: 'delay',
        key: uuid(),
        params: { ...messageParam, ...waitForParam },
      },
    ],
  }
}
