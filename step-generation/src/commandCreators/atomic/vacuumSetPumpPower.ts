import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import {
  formatPyRuntimeValue,
  getModuleHasLiveTask,
  indentPyLines,
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'
import { getVacuumPumpHoldArgsPython } from '../../utils/vacuumPythonArgs/getVacuumPumpHoldArgsPython'

import type { CommandCreator, VacuumSetPumpPowerStepGenArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPower: CommandCreator<
  VacuumSetPumpPowerStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { percentPower, duration, ventAfter } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedPercentPower = resolveNumericRuntimeValue(
    percentPower,
    runtimeParameters
  )
  const resolvedDuration =
    duration == null
      ? undefined
      : resolveNumericRuntimeValue(duration, runtimeParameters)
  const resolvedVentAfter =
    ventAfter == null
      ? undefined
      : resolveBooleanRuntimeValue(ventAfter, runtimeParameters)

  const rawValues = [args.moduleId, percentPower, duration, ventAfter]
  const resolvedValues = [
    moduleId,
    resolvedPercentPower,
    resolvedDuration,
    resolvedVentAfter,
  ]
  const errors = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] === null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  if (
    errors.length > 0 ||
    moduleId == null ||
    resolvedPercentPower == null ||
    resolvedDuration === null ||
    resolvedVentAfter === null
  ) {
    return { errors }
  }
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
        duration: resolvedDuration,
        ventAfter: resolvedVentAfter,
        taskId,
      }
    : null

  const percentPowerArg = `percent_power=${formatPyRuntimeValue(percentPower)}`
  const holdArgsPython = isTimedHold
    ? getVacuumPumpHoldArgsPython(duration, ventAfter)
    : []
  const allArgsPython = [percentPowerArg, ...holdArgsPython]
  const taskPython = isTimedHold ? `${taskId} = ` : ''
  const python = `${taskPython}${module.pythonName}.start_set_vacuum_power(\n${indentPyLines(allArgsPython.join(',\n'))}\n)`
  return {
    commands: [
      {
        commandType: 'vacuumModule/startSetVacuumPower',
        key: uuid(),
        params: {
          moduleId,
          percentPower: resolvedPercentPower,
          ...(holdArgs != null ? holdArgs : {}),
        },
      },
    ],
    python,
  }
}
