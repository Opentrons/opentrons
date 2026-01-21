import { PROTOCOL_CONTEXT_NAME, uuid } from '../../utils'

import type { WaitForTasksParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const waitForTasks: CommandCreator<WaitForTasksParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const pythonArg = `[${args.task_ids.join(', ')}]`
  const python = `${PROTOCOL_CONTEXT_NAME}.wait_for_tasks(${pythonArg})`
  return {
    commands: [
      {
        key: uuid(),
        commandType: 'waitForTasks',
        params: args,
      },
    ],
    python,
  }
}
