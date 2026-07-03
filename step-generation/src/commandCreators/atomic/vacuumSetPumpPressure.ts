import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import {
  formatPyValue,
  getModuleHasLiveTask,
  indentPyLines,
  uuid,
} from '../../utils'
import { getVacuumPumpHoldArgsPython } from '../../utils/vacuumPythonArgs/getVacuumPumpHoldArgsPython'

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

  const gaugePressureArg = `gauge_pressure_mbar=${formatPyValue(gaugePressure)}`
  const holdArgsPython = isTimedHold
    ? getVacuumPumpHoldArgsPython(duration, ventAfter)
    : []
  const allArgsPython = [gaugePressureArg, ...holdArgsPython]
  const taskPython = isTimedHold ? `${taskId} = ` : ''
  const python = `${taskPython}${module.pythonName}.start_set_vacuum_pressure(\n${indentPyLines(allArgsPython.join(',\n'))}\n)`
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
    python,
  }
}
