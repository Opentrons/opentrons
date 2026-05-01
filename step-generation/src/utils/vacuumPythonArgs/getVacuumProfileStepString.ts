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
  if ('pressureMbar' in step) {
    const { pressureMbar, holdSeconds } = step
    return formatPyDict({
      gauge_pressure: pressureMbar,
      hold_time_seconds: holdSeconds,
    })
  }
  const { powerPercent, holdSeconds } = step
  return formatPyDict({
    power_percent: Number(powerPercent),
    hold_time_seconds: Number(holdSeconds),
  })
}

export const getVacuumProfileStepString = (
  profile: VacuumProfile
): string[] => {
  // return sole cycle with repetitions if applicable
  let profileArg: string
  let repetitionsArg: string
  if (profile.length === 1 && 'repetitions' in profile[0]) {
    const { steps, repetitions } = profile[0]
    profileArg = `profile=[\n${indentPyLines(steps.map(_getVacuumProfileAtomicStepString).join(',\n'))}\n]`
    repetitionsArg = `repetitions=${formatPyValue(repetitions)}`
    return [profileArg, repetitionsArg]
  } else {
    // either a single atomic step or multiple steps
    const atomicProfileSteps = _getAtomicVacuumProfileSteps(profile)
    profileArg = `profile=[\n${indentPyLines(atomicProfileSteps.map(_getVacuumProfileAtomicStepString).join(',\n'))}\n]`
    // hard-coded to 1 repetition if we flatten all steps
    repetitionsArg = `repetitions=${formatPyValue(1)}`
  }
  return [profileArg, repetitionsArg]
}
