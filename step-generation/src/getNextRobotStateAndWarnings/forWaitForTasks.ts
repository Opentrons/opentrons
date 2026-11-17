import { resolveStringRuntimeValue } from '../utils'
import { waitingForNonexistentTask } from '../warningCreators'
import { handleWaitForTaskForThermocyclers } from './thermocyclerUpdates'
import { handleWaitForTaskForVacuums } from './vacuumUpdates'

import type { ModuleType, WaitForTasksParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forWaitForTasks(
  params: WaitForTasksParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { runtimeParameters } = invariantContext
  for (const taskId of params.task_ids) {
    const resolvedTaskId = resolveStringRuntimeValue(taskId, runtimeParameters)
    if (resolvedTaskId == null) {
      console.error(
        `forWaitForTasks: arg resolved to null (taskId=${String(resolvedTaskId)})`
      )
    }
    const handled =
      resolvedTaskId != null &&
      handleWaitForTaskForModules(resolvedTaskId, robotStateAndWarnings)

    if (!handled) {
      robotStateAndWarnings.warnings.push(waitingForNonexistentTask())
    }
  }
}

export const handleWaitForTaskForModules = (
  taskId: string,
  robotStateAndWarnings: RobotStateAndWarnings,
  // optional override to only check for a specific module type
  moduleType?: ModuleType
): boolean => {
  const { robotState } = robotStateAndWarnings
  const temporalModuleThatOwnsTask = Object.values(robotState.modules).find(
    module => {
      // if moduleType override is provided, only return true if the module type matches
      if (moduleType && module.moduleState.type !== moduleType) {
        return false
      }
      const isThermocyclerTask =
        module.moduleState.type === 'thermocyclerModuleType' &&
        module.moduleState.currentBlockActivity.type === 'profile' &&
        module.moduleState.currentBlockActivity.taskId === taskId
      const isVacuumTask =
        module.moduleState.type === 'vacuumModuleType' &&
        (module.moduleState.currentPumpActivity.type === 'timedHold' ||
          module.moduleState.currentPumpActivity.type === 'profile') &&
        module.moduleState.currentPumpActivity.taskId === taskId
      return isThermocyclerTask || isVacuumTask
    }
  )
  if (temporalModuleThatOwnsTask == null) {
    return false
  }
  if (
    temporalModuleThatOwnsTask.moduleState.type === 'thermocyclerModuleType'
  ) {
    return handleWaitForTaskForThermocyclers(
      temporalModuleThatOwnsTask.moduleState
    )
  }
  if (temporalModuleThatOwnsTask.moduleState.type === 'vacuumModuleType') {
    return handleWaitForTaskForVacuums(temporalModuleThatOwnsTask.moduleState)
  }
  console.log(
    `unexpected module type with task: ${temporalModuleThatOwnsTask.moduleState.type}`
  )
  return false
}
