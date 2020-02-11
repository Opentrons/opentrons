// @flow
import {
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_RESUME,
} from '../../../constants'

import type { FormData } from '../../../form-types'
import type { AwaitTemperatureArgs, PauseArgs } from '../../../step-generation'

export const pauseFormToArgs = (
  formData: FormData
): PauseArgs | AwaitTemperatureArgs | null => {
  const hours = parseFloat(formData['pauseHour']) || 0
  const minutes = parseFloat(formData['pauseMinute']) || 0
  const seconds = parseFloat(formData['pauseSecond']) || 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  const temperature = parseFloat(formData['pauseTemperature'])
  const message = formData['pauseMessage'] || ''

  switch (formData.pauseForAmountOfTime) {
    case PAUSE_UNTIL_TEMP:
      return {
        commandCreatorFnName: 'awaitTemperature',
        temperature,
        module: formData.moduleId,
      }
    case PAUSE_UNTIL_TIME:
      return {
        commandCreatorFnName: 'delay',
        name: `Pause ${formData.id}`, // TODO real name for steps
        description: formData.description || '', // TODO get from form
        wait: totalSeconds,
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
        name: `Pause ${formData.id}`, // TODO real name for steps
        description: formData.description || '', // TODO get from form
        wait: true,
        message,
        meta: {
          hours,
          minutes,
          seconds,
        },
      }
    default:
      return null
  }
}
