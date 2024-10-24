import type { FormData } from '../../form-types'
import type { HydratedFormData } from '../formLevel/errors'

const TIME_DELIMITER = ':'

interface TimeData {
  minutes: number
  seconds: number
  hours: number
}

export const getTimeFromForm = (
  formData: FormData | HydratedFormData,
  timeField: string,
  secondsField: string,
  minutesField: string,
  hoursField?: string
): TimeData => {
  let hoursFromForm
  let minutesFromForm
  let secondsFromForm

  // importing results in stringified "null" value
  if (formData[timeField] != null && formData[timeField] !== 'null') {
    const timeSplit = formData[timeField].split(TIME_DELIMITER)
    ;[hoursFromForm, minutesFromForm, secondsFromForm] =
      timeSplit.length === 3 ? timeSplit : [0, ...timeSplit]
  } else {
    // TODO (nd 09/23/2024): remove individual time units after redesign FF is removed
    ;[hoursFromForm, minutesFromForm, secondsFromForm] = [
      hoursField != null ? formData[hoursField] : null,
      formData[minutesField],
      formData[secondsField],
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
