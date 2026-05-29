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
  step: AtomicVacuumProfileStep
): string => {
  const { holdSeconds, ventAfter } = step
  const baseDict = {
    hold_time_seconds: holdSeconds,
    ...(ventAfter != null ? { vent_after: ventAfter } : {}),
  }
  if ('gaugePressureMbar' in step) {
    const { gaugePressureMbar } = step
    return formatPyDict({
      gauge_pressure_mbar: gaugePressureMbar,
      ...baseDict,
      vent_after: ventAfter,
    })
  }
  const { percentPower } = step
  return formatPyDict({
    percent_power: Number(percentPower),
    ...baseDict,
    vent_after: ventAfter,
  })
}

export const getVacuumProfileStepString = (
  profile: VacuumProfile
): string[] => {
  let profileArg: string
  let repetitionsArg: string
  if (profile.length === 1 && 'repetitions' in profile[0]) {
    const { steps, repetitions } = profile[0]
    profileArg = `profile=[\n${indentPyLines(
      steps
        .map((step, i) => {
          if (i === steps.length - 1) {
            return _getVacuumProfileAtomicStepString(step)
          }
          return _getVacuumProfileAtomicStepString(step)
        })
        .join(',\n')
    )}\n]`
    repetitionsArg = `repetitions=${formatPyValue(repetitions)}`
    return [profileArg, repetitionsArg]
  }
  const atomicProfileSteps = _getAtomicVacuumProfileSteps(profile)
  profileArg = `profile=[\n${indentPyLines(
    atomicProfileSteps
      .map((step, i) => {
        if (i === atomicProfileSteps.length - 1) {
          return _getVacuumProfileAtomicStepString(step)
        }
        return _getVacuumProfileAtomicStepString(step)
      })
      .join(',\n')
  )}\n]`
  // hard-coded to 1 repetition if we flatten all steps
  repetitionsArg = `repetitions=${formatPyValue(1)}`
  return [profileArg, repetitionsArg]
}
