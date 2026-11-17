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
import { getVacuumProfileStepString } from '../../utils/vacuumPythonArgs/getVacuumProfileStepString'

import type {
  AtomicVacuumProfileStep,
  VacuumModuleStartRunProfileCreateCommand,
  VacuumProfile,
  VacuumProfileCycle,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  RuntimeParameters,
  VacuumCloseVentStartProfileArgs,
} from '../../types'

type RuntimeVacuumProfile = VacuumCloseVentStartProfileArgs['profile']
type RuntimeVacuumStep = RuntimeVacuumProfile[number]

const resolveNumber = (
  value: number | string,
  runtimeParameters: RuntimeParameters,
  errors: CommandCreatorError[]
): number | null => {
  const resolved = resolveNumericRuntimeValue(value, runtimeParameters)
  if (typeof value === 'string' && resolved == null) {
    errors.push(errorCreators.invalidRuntimeParameter({ parameterName: value }))
  }
  return resolved
}

const resolveBoolean = (
  value: boolean | string,
  runtimeParameters: RuntimeParameters,
  errors: CommandCreatorError[]
): boolean | null => {
  const resolved = resolveBooleanRuntimeValue(value, runtimeParameters)
  if (typeof value === 'string' && resolved == null) {
    errors.push(errorCreators.invalidRuntimeParameter({ parameterName: value }))
  }
  return resolved
}

const resolveOptionalNumber = (
  value: number | string | undefined,
  runtimeParameters: RuntimeParameters,
  errors: CommandCreatorError[]
): number | undefined | null =>
  value === undefined
    ? undefined
    : resolveNumber(value, runtimeParameters, errors)

const resolveOptionalBoolean = (
  value: boolean | string | undefined,
  runtimeParameters: RuntimeParameters,
  errors: CommandCreatorError[]
): boolean | undefined | null =>
  value === undefined
    ? undefined
    : resolveBoolean(value, runtimeParameters, errors)

const resolveAtomicVacuumStep = (
  step: Extract<RuntimeVacuumStep, { holdSeconds: number | string }>,
  runtimeParameters: RuntimeParameters,
  errors: CommandCreatorError[]
): AtomicVacuumProfileStep | null => {
  const holdSeconds = resolveNumber(step.holdSeconds, runtimeParameters, errors)
  const enablePump = resolveBoolean(step.enablePump, runtimeParameters, errors)
  const holdTimeSeconds = resolveOptionalNumber(
    step.holdTimeSeconds,
    runtimeParameters,
    errors
  )
  const holdTimeMinutes = resolveOptionalNumber(
    step.holdTimeMinutes,
    runtimeParameters,
    errors
  )
  const rampRate = resolveOptionalNumber(
    step.rampRate,
    runtimeParameters,
    errors
  )
  const timeoutSeconds = resolveOptionalNumber(
    step.timeoutSeconds,
    runtimeParameters,
    errors
  )
  const stepVentAfter = resolveOptionalBoolean(
    step.ventAfter,
    runtimeParameters,
    errors
  )
  if (
    holdSeconds == null ||
    enablePump == null ||
    holdTimeSeconds === null ||
    holdTimeMinutes === null ||
    rampRate === null ||
    timeoutSeconds === null ||
    stepVentAfter === null
  ) {
    return null
  }
  const base = {
    holdSeconds,
    enablePump,
    ...(holdTimeSeconds !== undefined ? { holdTimeSeconds } : {}),
    ...(holdTimeMinutes !== undefined ? { holdTimeMinutes } : {}),
    ...(rampRate !== undefined ? { rampRate } : {}),
    ...(timeoutSeconds !== undefined ? { timeoutSeconds } : {}),
    ...(stepVentAfter !== undefined ? { ventAfter: stepVentAfter } : {}),
  }
  if ('gaugePressureMbar' in step) {
    const gaugePressureMbar = resolveNumber(
      step.gaugePressureMbar,
      runtimeParameters,
      errors
    )
    return gaugePressureMbar == null ? null : { ...base, gaugePressureMbar }
  }
  const percentPower = resolveNumber(
    step.percentPower,
    runtimeParameters,
    errors
  )
  return percentPower == null ? null : { ...base, percentPower }
}

const resolveVacuumProfile = (
  profile: RuntimeVacuumProfile,
  runtimeParameters: RuntimeParameters,
  errors: CommandCreatorError[]
): VacuumProfile | null => {
  const resolved: VacuumProfile = []
  for (const step of profile) {
    if ('repetitions' in step) {
      const repetitions = resolveNumber(
        step.repetitions,
        runtimeParameters,
        errors
      )
      const cycleVentAfter = resolveOptionalBoolean(
        step.ventAfter,
        runtimeParameters,
        errors
      )
      const steps: AtomicVacuumProfileStep[] = []
      for (const atomicStep of step.steps) {
        const resolvedStep = resolveAtomicVacuumStep(
          atomicStep,
          runtimeParameters,
          errors
        )
        if (resolvedStep == null) {
          return null
        }
        steps.push(resolvedStep)
      }
      if (repetitions == null || cycleVentAfter === null) {
        return null
      }
      const cycle: VacuumProfileCycle = {
        repetitions,
        steps,
        ...(cycleVentAfter !== undefined ? { ventAfter: cycleVentAfter } : {}),
      }
      resolved.push(cycle)
      continue
    }
    const resolvedStep = resolveAtomicVacuumStep(
      step,
      runtimeParameters,
      errors
    )
    if (resolvedStep == null) {
      return null
    }
    resolved.push(resolvedStep)
  }
  return resolved
}

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumStartRunProfile: CommandCreator<{
  moduleId: string
  profile: RuntimeVacuumProfile
  ventAfter: boolean | string
}> = (args, invariantContext, prevRobotState) => {
  const { profile, ventAfter } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedVentAfter = resolveBooleanRuntimeValue(
    ventAfter,
    runtimeParameters
  )

  const rawValues = [args.moduleId, ventAfter]
  const resolvedValues = [moduleId, resolvedVentAfter]
  const errors = rawValues.flatMap((value, i) =>
    typeof value === 'string' && resolvedValues[i] === null
      ? [errorCreators.invalidRuntimeParameter({ parameterName: value })]
      : []
  )
  const resolvedProfile = resolveVacuumProfile(
    profile,
    runtimeParameters,
    errors
  )
  if (
    errors.length > 0 ||
    moduleId == null ||
    resolvedVentAfter == null ||
    resolvedProfile == null
  ) {
    return { errors }
  }

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
  const profilePythonArgs = getVacuumProfileStepString(resolvedProfile)
  const ventAfterPythonArg = `vent_after=${formatPyRuntimeValue(ventAfter)}`

  // explicitly attach the ventAfter param to the final step of the profile in accordance with PE command shape
  // there is no direct ventAfter param at the startRunProfile command params top level
  const profileWithVentOnFinal: VacuumModuleStartRunProfileCreateCommand['params']['steps'] =
    resolvedProfile.map((step, index) => {
      if (index === resolvedProfile.length - 1) {
        return { ...step, ventAfter: resolvedVentAfter }
      }
      return step
    })

  const python = `${taskId} = ${vacuumPythonName}.start_execute_profile(\n${indentPyLines([...profilePythonArgs, ventAfterPythonArg].join(',\n'))}\n)`

  return {
    commands: [
      {
        commandType: 'vacuumModule/startRunProfile',
        key: uuid(),
        params: {
          moduleId,
          steps: profileWithVentOnFinal,
          ventAfter: resolvedVentAfter,
          taskId,
        },
      },
    ],
    python,
  }
}
