import {
  VACUUM_MAX_PRESSURE_MBAR,
  VACUUM_MIN_PRESSURE_MBAR,
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'

import { PROFILE_STEP } from './constants'

import type {
  ProfileStepItem,
  VacuumPumpData,
  VacuumStepData,
  VacuumStepErrors,
} from './types'

export type VacuumMode = typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER

export function getDefaultStepData(
  mode: VacuumMode | undefined
): VacuumStepData {
  const baseData = {
    id: '',
    time: '',
    name: '',
    type: PROFILE_STEP,
  }
  return mode === VACUUM_MODE_PRESSURE
    ? {
        ...baseData,
        pumpData: { mode: VACUUM_MODE_PRESSURE, pressureMbar: null },
      }
    : { ...baseData, pumpData: { mode: VACUUM_MODE_POWER, powerPercent: 1 } }
}

const getIsNameError = (name: string): boolean => name === ''

const getIsTimeError = (time: string): boolean =>
  time === '' || !/^\d{0,2}(:\d{0,2})?$/.test(time)

const getIsPumpDataError = (pumpData: VacuumPumpData): boolean => {
  if (pumpData.mode === VACUUM_MODE_POWER) {
    return false
  }
  const { pressureMbar: rawPressureMbar } = pumpData
  const pressureMbar = rawPressureMbar ? Number(rawPressureMbar) : null
  return (
    pumpData.mode === VACUUM_MODE_PRESSURE &&
    (pressureMbar === null ||
      pressureMbar < VACUUM_MIN_PRESSURE_MBAR ||
      pressureMbar > VACUUM_MAX_PRESSURE_MBAR)
  )
}

export const getStepErrors = (step: VacuumStepData): VacuumStepErrors => {
  return {
    name: getIsNameError(step.name),
    time: getIsTimeError(step.time),
    pumpData: getIsPumpDataError(step.pumpData),
  }
}

export const getIsStepValid = (step: VacuumStepData): boolean => {
  const errors = getStepErrors(step)
  return !Object.values(errors).some(Boolean)
}

export const getInvalidPresavedStepIds = (
  orderedProfileStepIds: string[],
  profileStepItemsById: Record<string, ProfileStepItem>
): string[] => {
  return orderedProfileStepIds.filter(stepId => {
    const step = profileStepItemsById[stepId]
    return step?.isPresaved === true && !getIsStepValid(step)
  })
}

export const getFormattedTime = (time: string): string => {
  const [minutes, rawSeconds] = time.split(':')
  const seconds = rawSeconds ? Number(rawSeconds) : 0
  return `${minutes.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
