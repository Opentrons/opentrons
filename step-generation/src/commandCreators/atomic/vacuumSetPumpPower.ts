import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import {
  formatPyValue,
  getModuleHasLiveTask,
  indentPyLines,
  uuid,
} from '../../utils'
import { getVacuumPumpHoldArgsPython } from '../../utils/vacuumPythonArgs/getVacuumPumpHoldArgsPython'

import type { CommandCreator, VacuumPumpPowerArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPower: CommandCreator<VacuumPumpPowerArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId, powerPercent, duration, ventAfter } = args
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

  const powerPercentArg = `power_percent=${formatPyValue(powerPercent)}`
  const holdArgsPython = isTimedHold
    ? getVacuumPumpHoldArgsPython(duration, ventAfter)
    : []
  const allArgsPython = [powerPercentArg, ...holdArgsPython]
  const python = `${taskPython}${module.pythonName}.set_power(\n${indentPyLines(allArgsPython.join(',\n'))}\n)`
  return {
    commands: [
      {
        commandType: 'vacuumModule/startSetVacuumPower',
        key: uuid(),
        params: {
          moduleId,
          percentPower: powerPercent,
          ...(holdArgs != null ? holdArgs : {}),
        },
      },
    ],
    python,
  }
}
