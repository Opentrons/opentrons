import { waitingForNonexistentTask } from '../warningCreators'
import { handleWaitForTaskForThermocyclers } from './thermocyclerUpdates'

import type { WaitForTasksParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forWaitForTasks(
  params: WaitForTasksParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  for (const taskId of params.task_ids) {
    const handled = handleWaitForTaskForThermocyclers(
      taskId,
      invariantContext,
      robotStateAndWarnings
    )

    if (!handled) {
      robotStateAndWarnings.warnings.push(waitingForNonexistentTask())
    }
  }
}
