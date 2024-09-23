import {
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_RESUME,
} from '../../../constants'
import type { FormData } from '../../../form-types'
import type {
  WaitForTemperatureArgs,
  PauseArgs,
} from '@opentrons/step-generation'

const TIME_DELIMITER = ':'

export const pauseFormToArgs = (
  formData: FormData
): PauseArgs | WaitForTemperatureArgs | null => {
  let hoursFromForm
  let minutesFromForm
  let secondsFromForm

  // importing results in stringified "null" value
  if (formData.pauseTime != null && formData.pauseTime !== 'null') {
    const timeSplit = formData.pauseTime.split(TIME_DELIMITER)
    ;[hoursFromForm, minutesFromForm, secondsFromForm] = timeSplit
  } else {
    // TODO (nd 09/23/2024): remove individual time units after redesign FF is removed
    ;[hoursFromForm, minutesFromForm, secondsFromForm] = [
      formData.pauseHour,
      formData.pauseMinute,
      formData.pauseSecond,
    ]
  }
  const hours = isNaN(parseFloat(hoursFromForm as string))
    ? 0
    : parseFloat(hoursFromForm as string)
  const minutes = isNaN(parseFloat(minutesFromForm as string))
    ? 0
    : parseFloat(minutesFromForm as string)
  const seconds = isNaN(parseFloat(secondsFromForm as string))
    ? 0
    : parseFloat(secondsFromForm as string)

  console.log({ hours, minutes, seconds })
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  const temperature = parseFloat(formData.pauseTemperature as string)
  const message = formData.pauseMessage ?? ''

  switch (formData.pauseAction) {
    case PAUSE_UNTIL_TEMP:
      return {
        commandCreatorFnName: 'waitForTemperature',
        temperature,
        module: formData.moduleId,
        message,
      }

    case PAUSE_UNTIL_TIME:
      return {
        commandCreatorFnName: 'delay',
        name: `Pause ${formData.id}`,
        // TODO real name for steps
        description: formData.description ?? '',
        // TODO get from form
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
        name: `Pause ${formData.id}`,
        // TODO real name for steps
        description: formData.description ?? '',
        // TODO get from form
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
