import { formatPyDict, formatPyValue, indentPyLines } from '../pythonFormat'

import type {
  AtomicVacuumProfileStep,
  VacuumProfile,
  VacuumProfileCycle,
} from '@opentrons/shared-data'

const _getAtomicVacuumStepsFromCycleStep = (
  step: VacuumProfileCycle
): AtomicVacuumProfileStep[] => {
  const { steps, repetitions } = step
  return Array.from({ length: repetitions }).flatMap(() => {
    return steps
  })
}

const _getAtomicVacuumProfileSteps = (
  profile: VacuumProfile
): AtomicVacuumProfileStep[] => {
  return profile.reduce<AtomicVacuumProfileStep[]>((acc, step) => {
    // cycle step
    if ('repetitions' in step) {
      const flattenedCycleSteps = _getAtomicVacuumStepsFromCycleStep(step)
      return [...acc, ...flattenedCycleSteps]
    }
    return [...acc, step]
  }, [])
}

const _getVacuumProfileAtomicStepString = (
  step: AtomicVacuumProfileStep,
  ventAfter?: boolean
): string => {
  if ('gaugePressureMbar' in step) {
    const { gaugePressureMbar, holdSeconds } = step
    return formatPyDict({
      gauge_pressure: gaugePressureMbar,
      hold_time_seconds: holdSeconds,
    })
  }
  const { percentPower, holdSeconds } = step
  return formatPyDict({
    power_percent: Number(percentPower),
    hold_time_seconds: Number(holdSeconds),
    ...(ventAfter != null ? { vent_after: formatPyValue(ventAfter) } : {}),
  })
}

export const getVacuumProfileStepString = (
  profile: VacuumProfile,
  ventAfter?: boolean
): string[] => {
  let profileArg: string
  let repetitionsArg: string
  // return sole cycle with repetitions if applicable
  if (profile.length === 1 && 'repetitions' in profile[0]) {
    const { steps, repetitions } = profile[0]
    profileArg = `profile=[\n${indentPyLines(
      steps
        .map((step, i) => {
          if (i === steps.length - 1) {
            return _getVacuumProfileAtomicStepString(step, ventAfter)
          }
          return _getVacuumProfileAtomicStepString(step)
        })
        .join(',\n')
    )}\n]`
    repetitionsArg = `repetitions=${formatPyValue(repetitions)}`
    return [profileArg, repetitionsArg]
  } else {
    // either a single atomic step or multiple steps
    const atomicProfileSteps = _getAtomicVacuumProfileSteps(profile)
    profileArg = `profile=[\n${indentPyLines(
      atomicProfileSteps
        .map((step, i) => {
          if (i === atomicProfileSteps.length - 1) {
            return _getVacuumProfileAtomicStepString(step, ventAfter)
          }
          return _getVacuumProfileAtomicStepString(step)
        })
        .join(',\n')
    )}\n]`
    // hard-coded to 1 repetition if we flatten all steps
    repetitionsArg = `repetitions=${formatPyValue(1)}`
  }
  return [profileArg, repetitionsArg]
}
