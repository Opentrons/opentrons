import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
} from '../../../constants'
import { getTimeFromForm } from '../../utils/getTimeFromForm'

import type {
  PauseArgs,
  WaitForModuleTaskArgs,
  WaitForTemperatureArgs,
} from '@opentrons/step-generation'
import type { HydratedPauseFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const pauseFormToArgs = (
  castFormData: GetCastFormData<HydratedPauseFormData>
): PauseArgs | WaitForModuleTaskArgs | WaitForTemperatureArgs | null => {
  const { hours, minutes, seconds } = getTimeFromForm(
    'pauseTime' in castFormData ? (castFormData.pauseTime ?? null) : null
  )
  const totalSeconds = (hours ?? 0) * 3600 + minutes * 60 + seconds
  // @ts-expect-error - todo(mm, 2025-10-09): Type error inherited from prior code.
  // targetHeaterShakerTemperature seems to already be a number. Confirm that
  // and remove this if it's safe.
  const temperature = parseFloat(castFormData.pauseTemperature)
  const message = castFormData.pauseMessage ?? ''

  switch (castFormData.pauseAction) {
    case PAUSE_UNTIL_TEMP:
      return {
        commandCreatorFnName: 'waitForTemperature',
        name: castFormData.stepName,
        description: castFormData.stepDetails ?? '',
        celsius: temperature,
        moduleId: castFormData.moduleId ?? '',
        message,
      }

    case PAUSE_UNTIL_TIME:
      return {
        commandCreatorFnName: 'delay',
        name: castFormData.stepName,
        description: castFormData.stepDetails ?? '',
        seconds: totalSeconds,
        message,
        meta: {
          hours,
          minutes,
          seconds,
        },
      }

    case PAUSE_UNTIL_RESUME:
      return {
        commandCreatorFnName: 'delay',
        name: castFormData.stepName,
        description: castFormData.stepDetails ?? '',
        message,
        meta: {
          hours,
          minutes,
          seconds,
        },
      }

    case PAUSE_UNTIL_TC_PROFILE_COMPLETE:
      return {
        commandCreatorFnName: 'waitForModuleTask',
        waitCondition: 'thermocyclerProfileComplete',
        moduleId: castFormData.moduleId ?? '',
      }

    case PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE: {
      // Step-generation `WaitForModuleTaskArgs` and `waitForModuleTask` vacuum branches land in a follow-up PR.
      const vacuumProfileWait = {
        commandCreatorFnName: 'waitForModuleTask' as const,
        waitCondition: 'vacuumProfileComplete' as const,
        moduleId: castFormData.moduleId ?? '',
      }
      return vacuumProfileWait as unknown as WaitForModuleTaskArgs
    }

    case PAUSE_UNTIL_VACUUM_STATE_COMPLETE: {
      const vacuumStateWait = {
        commandCreatorFnName: 'waitForModuleTask' as const,
        waitCondition: 'vacuumStateComplete' as const,
        moduleId: castFormData.moduleId ?? '',
      }
      return vacuumStateWait as unknown as WaitForModuleTaskArgs
    }

    default:
      return null
  }
}
