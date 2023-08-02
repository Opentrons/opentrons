import { uuid } from '../../utils'
import type { PauseArgs, CommandCreator } from '../../types'
import type {
  WaitForDurationCreateCommand,
  WaitForResumeCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV7'
export const delay: CommandCreator<PauseArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  //  delay is deprecated and now is either waitForResume or waitForDuration
  let command: WaitForResumeCreateCommand | WaitForDurationCreateCommand
  if (args.wait === true) {
    command = {
      commandType: 'waitForResume',
      key: uuid(),
      params: { message: args.message },
    }
  } else {
    command = {
      commandType: 'waitForDuration',
      key: uuid(),
      params: { seconds: args.wait, message: args.message },
    }
  }
  return {
    commands: [command],
  }
}
