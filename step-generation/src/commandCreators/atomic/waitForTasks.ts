import * as errorCreators from '../../errorCreators'
import {
  PROTOCOL_CONTEXT_NAME,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  WaitForTasksStepGenArgs,
} from '../../types'

export const waitForTasks: CommandCreator<WaitForTasksStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { runtimeParameters } = invariantContext
  const errors: CommandCreatorError[] = []
  const resolvedTaskIds: string[] = []
  args.task_ids.forEach(taskId => {
    const resolvedTaskId = resolveStringRuntimeValue(taskId, runtimeParameters)
    if (resolvedTaskId == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({ parameterName: taskId })
      )
    } else {
      resolvedTaskIds.push(resolvedTaskId)
    }
  })
  if (errors.length > 0) {
    return { errors }
  }
  const pythonArg = `[${resolvedTaskIds.join(', ')}]`
  const python = `${PROTOCOL_CONTEXT_NAME}.wait_for_tasks(${pythonArg})`
  return {
    commands: [
      {
        key: uuid(),
        commandType: 'waitForTasks',
        params: { task_ids: resolvedTaskIds },
      },
    ],
    python,
  }
}
