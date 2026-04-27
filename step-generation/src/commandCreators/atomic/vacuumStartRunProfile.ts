import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import { getModuleHasLiveTask, uuid } from '../../utils'

import type { VacuumModuleStartRunProfileCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumStartRunProfile: CommandCreator<
  VacuumModuleStartRunProfileCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, profile } = args

  // TODO: (nd, 2026-04-23) implement Python
  const vacuumState = vacuumModuleStateGetter(prevRobotState, moduleId)
  if (vacuumState === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const hasLiveTask = getModuleHasLiveTask(vacuumState)
  if (hasLiveTask) {
    return {
      errors: [errorCreators.liveTaskError()],
    }
  }

  const vacuumPythonName = invariantContext.moduleEntities[moduleId].pythonName

  // 1-indexed profile task ID
  const taskId = `${vacuumPythonName}_task_${vacuumState.numPumpActivitiesStarted + 1}`

  const dummyPython = `${taskId} = ${vacuumPythonName}.start_profile(...)`

  return {
    commands: [
      {
        commandType: 'vacuumModule/startRunProfile',
        key: uuid(),
        params: {
          moduleId,
          profile,
          taskId,
        },
      },
    ],
    // TODO: (nd, 2026-04-23) implement Python
    python: dummyPython,
  }
}
