import {
  VACUUM_MAX_PRESSURE_MBAR,
  VACUUM_MIN_PRESSURE_MBAR,
} from '@opentrons/shared-data'
import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'

import { PROFILE_STEP } from './constants'

import type { VacuumProfileStep } from '/protocol-designer/form-types'
import type {
  VacuumProfileStepItem,
  VacuumPumpData,
  VacuumStepErrors,
} from './types'

export type VacuumMode = typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER

export function getDefaultStepData(mode: VacuumMode): VacuumProfileStep {
  const baseData = {
    id: '',
    time: '',
    title: '',
    type: PROFILE_STEP,
  }
  return mode === VACUUM_MODE_PRESSURE
    ? {
        ...baseData,
        pumpData: { mode: VACUUM_MODE_PRESSURE, pressureMbar: null },
        ventAfter: false,
      }
    : {
        ...baseData,
        pumpData: { mode: VACUUM_MODE_POWER, percentPower: 1 },
        ventAfter: false,
      }
}

const getIsTitleError = (title: string): boolean => {
  return title.trim() === ''
}

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

export const getStepErrors = (step: VacuumProfileStep): VacuumStepErrors => {
  return {
    title: getIsTitleError(step.title),
    time: getIsTimeError(step.time),
    pumpData: getIsPumpDataError(step.pumpData),
  }
}

export const getIsStepValid = (step: VacuumProfileStep): boolean => {
  const errors = getStepErrors(step)
  return !Object.values(errors).some(Boolean)
}

export const getInvalidPresavedStepIds = (
  orderedProfileStepIds: string[],
  profileStepItemsById: Record<string, VacuumProfileStepItem>
): string[] => {
  return orderedProfileStepIds.filter(stepId => {
    const step = profileStepItemsById[stepId]
    return step?.isPresaved === true && !getIsStepValid(step)
  })
}
