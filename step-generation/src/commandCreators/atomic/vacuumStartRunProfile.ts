import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import {
  formatPyValue,
  getModuleHasLiveTask,
  indentPyLines,
  uuid,
} from '../../utils'
import { getVacuumProfileStepString } from '../../utils/vacuumPythonArgs/getVacuumProfileStepString'

import type { VacuumModuleStartRunProfileCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumStartRunProfile: CommandCreator<
  VacuumModuleStartRunProfileCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, profile, ventAfter } = args

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
  const profileArgs = getVacuumProfileStepString(profile)
  const ventAfterArg = ventAfter
    ? `vent_after=${formatPyValue(ventAfter)}`
    : null
  const allArgs = [
    ...profileArgs,
    ...(ventAfterArg != null ? [ventAfterArg] : []),
  ]

  const dummyPython = `${taskId} = ${vacuumPythonName}.start_execute_profile(\n${indentPyLines(allArgs.join(',\n'))}\n)`

  return {
    commands: [
      {
        commandType: 'vacuumModule/startRunProfile',
        key: uuid(),
        params: {
          moduleId,
          profile,
          ventAfter,
          taskId,
        },
      },
    ],
    // TODO: (nd, 2026-04-23) implement Python
    python: dummyPython,
  }
}
