import {
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_OFF,
  VACUUM_STATE_PUMP_ON,
  VACUUM_VENT_SET_CLOSED,
  VACUUM_VENT_SET_OPEN,
} from '@opentrons/step-generation'

import { PROFILE_CYCLE, PROFILE_STEP } from '/protocol-designer/form-types'

import type {
  AtomicVacuumProfileStep,
  VacuumProfileCycle as PeVacuumProfileCycle,
} from '@opentrons/shared-data'
import type {
  VacuumArgs,
  VacuumProfileItem,
  VacuumProfileStep,
  VacuumPumpAdvancedArgs,
} from '@opentrons/step-generation'
import type { VacuumProfileStep as FormVacuumProfileStep } from '/protocol-designer/form-types'
import type { HydratedVacuumFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

type StepGenVacuumProfileStep = Extract<
  VacuumProfileItem,
  { type: typeof PROFILE_STEP }
>

/** Parses a colon-delimited time string into total seconds (supports HH:MM:SS and shorter segments). */
const getTimeSecondsFromString = (timeString: string): number => {
  const [seconds, minutes, hours] = timeString.split(':').reverse().map(Number)
  return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0)
}

/** Maps PD form pump fields to the step-generation vacuum profile pump payload shape. */
const pumpDataToStepGeneration = (
  pumpData: FormVacuumProfileStep['pumpData']
): VacuumProfileStep['pumpData'] => {
  if (pumpData.mode === VACUUM_MODE_PRESSURE) {
    return {
      mode: pumpData.mode,
      pressureMbar: pumpData.pressureMbar,
    }
  }
  return {
    mode: pumpData.mode,
    percentPower: pumpData.percentPower,
  }
}

/** Converts one vacuum profile step from form data into a step-generation profile step item. */
const formVacuumProfileStepToItem = (
  step: FormVacuumProfileStep
): StepGenVacuumProfileStep => ({
  type: PROFILE_STEP,
  id: step.id,
  durationSeconds: getTimeSecondsFromString(step.time),
  pumpData: pumpDataToStepGeneration(step.pumpData),
  ventAfter: step.ventAfter,
})

/** Builds step-generation profile elements from `vacuumOrderedProfileIds` and `vacuumProfileItemsById`. */
function getProfileElementsFromForm(
  vacuumOrderedProfileIds: HydratedVacuumFormData['vacuumOrderedProfileIds'],
  vacuumProfileItemsById: HydratedVacuumFormData['vacuumProfileItemsById']
): VacuumProfileItem[] {
  return vacuumOrderedProfileIds.map(profileItemId => {
    const profileItem = vacuumProfileItemsById[profileItemId]
    if (profileItem.type === PROFILE_STEP) {
      return formVacuumProfileStepToItem(profileItem)
    }
    const { profileStepItemsById, orderedProfileStepIds, id, repetitions } =
      profileItem
    const cycleSteps = orderedProfileStepIds.map(cycleStepId => {
      const cycleStep = profileStepItemsById[cycleStepId]
      return formVacuumProfileStepToItem(cycleStep)
    })
    return {
      type: PROFILE_CYCLE,
      id,
      repetitions: Number(repetitions),
      steps: cycleSteps,
    }
  })
}

const vacuumProfileStepToAtomic = (
  step: StepGenVacuumProfileStep
): AtomicVacuumProfileStep => {
  const { durationSeconds, pumpData, ventAfter } = step
  if (pumpData.mode === VACUUM_MODE_PRESSURE) {
    const mbar = pumpData.pressureMbar
    return {
      enablePump: true,
      holdSeconds: durationSeconds,
      gaugePressureMbar:
        mbar != null && mbar !== '' ? Number.parseFloat(mbar) : 0,
      ventAfter,
    }
  }
  return {
    enablePump: true,
    holdSeconds: durationSeconds,
    percentPower: pumpData.percentPower,
    ventAfter,
  }
}

const vacuumProfileItemToPeProfileElement = (
  item: VacuumProfileItem
): PeVacuumProfileCycle | AtomicVacuumProfileStep => {
  if (item.type === PROFILE_CYCLE) {
    return {
      repetitions: item.repetitions,
      steps: item.steps.map(vacuumProfileStepToAtomic),
    }
  }
  return vacuumProfileStepToAtomic(item)
}

/** Optional timed pump end: duration in seconds and whether to vent after, when the form enables them. */
const getPumpEndSettings = (args: {
  pumpDurationCheckbox: HydratedVacuumFormData['pumpDurationCheckbox']
  pumpDurationTime: HydratedVacuumFormData['pumpDurationTime']
  endingHoldVentCheckbox: HydratedVacuumFormData['endingHoldVentCheckbox']
}): VacuumPumpAdvancedArgs | null => {
  const { pumpDurationCheckbox, pumpDurationTime, endingHoldVentCheckbox } =
    args
  if (!(pumpDurationCheckbox === true && pumpDurationTime != null)) {
    return null
  }
  const duration = getTimeSecondsFromString(pumpDurationTime)
  return { duration, ventAfter: endingHoldVentCheckbox ?? false }
}

export const vacuumFormToArgs = (
  castFormData: GetCastFormData<HydratedVacuumFormData>
): VacuumArgs | null => {
  const {
    moduleId,
    programType,
    stateType,
    modeType,
    pressureMbar,
    percentPower,
    pumpDurationCheckbox,
    pumpDurationTime,
    endingHoldVentCheckbox,
    vacuumOrderedProfileIds,
    vacuumProfileItemsById,
    stepDetails,
    stepName,
  } = castFormData

  if (moduleId == null) {
    return null
  }
  const baseValues = { description: stepDetails, name: stepName, moduleId }

  switch (programType) {
    case VACUUM_PROGRAM_STATE:
      switch (stateType) {
        case VACUUM_STATE_PUMP_ON:
          const pumpAdvancedArgs = getPumpEndSettings({
            pumpDurationCheckbox,
            pumpDurationTime,
            endingHoldVentCheckbox,
          })
          if (modeType === VACUUM_MODE_PRESSURE) {
            return {
              commandCreatorFnName: 'vacuumCloseVentSetPumpPressure',
              gaugePressure: pressureMbar!,
              ...pumpAdvancedArgs,
              ...baseValues,
            }
          }
          return {
            commandCreatorFnName: 'vacuumCloseVentSetPumpPower',
            percentPower: percentPower!,
            ...pumpAdvancedArgs,
            ...baseValues,
          }
        case VACUUM_STATE_PUMP_OFF:
          return {
            commandCreatorFnName: 'vacuumStopPump',
            ...baseValues,
          }
        case VACUUM_VENT_SET_OPEN:
          return {
            commandCreatorFnName: 'vacuumOpenVent',
            ...baseValues,
          }
        case VACUUM_VENT_SET_CLOSED:
          return {
            commandCreatorFnName: 'vacuumCloseVent',
            ...baseValues,
          }

        // should never hit
        default:
          return null
      }
    case VACUUM_PROGRAM_PROFILE: {
      const profileElements = getProfileElementsFromForm(
        vacuumOrderedProfileIds,
        vacuumProfileItemsById
      )
      return {
        commandCreatorFnName: 'vacuumCloseVentStartProfile',
        profile: profileElements.map(vacuumProfileItemToPeProfileElement),
        ventAfter: endingHoldVentCheckbox ?? false,
        ...baseValues,
      }
    }

    // should never hit
    default:
      return null
  }
}
