import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import { getModuleHasLiveTask, uuid } from '../../utils'

import type { CommandCreator, VacuumPumpPressureArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPressure: CommandCreator<VacuumPumpPressureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId, gaugePressure, duration, ventAfter } = args
  const module = invariantContext.moduleEntities[moduleId]

  const moduleState = vacuumModuleStateGetter(prevRobotState, moduleId)
  if (moduleState == null || module == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const hasLiveTask = getModuleHasLiveTask(moduleState)
  if (hasLiveTask) {
    return {
      errors: [errorCreators.liveTaskError()],
    }
  }

  const isTimedHold = duration != null
  const taskId = isTimedHold
    ? `${module.pythonName}_task_${moduleState.numPumpActivitiesStarted + 1}`
    : null

  const holdArgs = isTimedHold
    ? {
        duration,
        ventAfter,
        taskId,
      }
    : null

  const taskPython = taskId == null ? '' : `${taskId} = `
  const dummyPython = `${taskPython}${module.pythonName}.set_pressure(${gaugePressure})`
  return {
    commands: [
      {
        commandType: 'vacuumModule/startSetVacuumPressure',
        key: uuid(),
        params: {
          moduleId,
          gaugePressure,
          ...(holdArgs != null ? holdArgs : {}),
        },
      },
    ],
    python: dummyPython,
  }
}
