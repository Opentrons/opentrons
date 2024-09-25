import type { FormData } from '../../form-types'
import type { HydratedFormData } from '../formLevel/errors'

const TIME_DELIMITER = ':'

interface TimeData {
  hours: number
  minutes: number
  seconds: number
}

export const getTimeFromPauseForm = (
  formData: FormData | HydratedFormData
): TimeData => {
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

  return { hours, minutes, seconds }
}
