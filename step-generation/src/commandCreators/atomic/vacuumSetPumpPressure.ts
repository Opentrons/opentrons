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

import type {
  CommandCreator,
  VacuumSetPumpPressureStepGenArgs,
} from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumSetPumpPressure: CommandCreator<
  VacuumSetPumpPressureStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { gaugePressure, duration, ventAfter } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedGaugePressure = resolveNumericRuntimeValue(
    gaugePressure,
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

  const rawValues = [args.moduleId, gaugePressure, duration, ventAfter]
  const resolvedValues = [
    moduleId,
    resolvedGaugePressure,
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
    resolvedGaugePressure == null ||
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

  const gaugePressureArg = `gauge_pressure_mbar=${formatPyRuntimeValue(gaugePressure)}`
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
          gaugePressure: resolvedGaugePressure,
          ...(holdArgs != null ? holdArgs : {}),
        },
      },
    ],
    python,
  }
}
