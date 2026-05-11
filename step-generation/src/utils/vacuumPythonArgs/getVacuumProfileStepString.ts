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
  const { holdSeconds } = step
  const baseDict = {
    hold_time_seconds: holdSeconds,
    ...(ventAfter != null ? { vent_after: ventAfter } : {}),
  }
  if ('gaugePressureMbar' in step) {
    const { gaugePressureMbar } = step
    return formatPyDict({
      gauge_pressure: gaugePressureMbar,
      ...baseDict,
    })
  }
  const { percentPower } = step
  return formatPyDict({
    power_percent: Number(percentPower),
    ...baseDict,
  })
}

export const getVacuumProfileStepString = (
  profile: VacuumProfile,
  ventAfter: boolean
): string[] => {
  // In the future, we should return sole cycle with repetitions if applicable
  // For now, the shape of the PE command and specced PAPI does not accommodate a
  // profile-scoped vent control param, so we flatten all steps and add the vent control
  // to the final-final step (last step of the last cycle repetition)
  // I will leave the code here for future reference if PE/PAPI support this behavior

  // let profileArg: string
  // let repetitionsArg: string
  // if (profile.length === 1 && 'repetitions' in profile[0]) {
  //   const { steps, repetitions } = profile[0]
  //   profileArg = `profile=[\n${indentPyLines(
  //     steps
  //       .map((step, i) => {
  //         if (i === steps.length - 1) {
  //           return _getVacuumProfileAtomicStepString(step, ventAfter)
  //         }
  //         return _getVacuumProfileAtomicStepString(step)
  //       })
  //       .join(',\n')
  //   )}\n]`
  //   repetitionsArg = `repetitions=${formatPyValue(repetitions)}`
  //   return [profileArg, repetitionsArg]

  const atomicProfileSteps = _getAtomicVacuumProfileSteps(profile)
  const profileArg = `profile=[\n${indentPyLines(
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
  const repetitionsArg = `repetitions=${formatPyValue(1)}`
  return [profileArg, repetitionsArg]
}
