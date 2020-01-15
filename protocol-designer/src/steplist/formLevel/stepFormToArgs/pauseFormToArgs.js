// @flow
import { PAUSE_UNTIL_TIME, PAUSE_UNTIL_TEMP } from '../../../constants'

import type { FormData } from '../../../form-types'
import type { PauseArgs } from '../../../step-generation'

const pauseFormToArgs = (formData: FormData): PauseArgs => {
  const hours = parseFloat(formData['pauseHour']) || 0
  const minutes = parseFloat(formData['pauseMinute']) || 0
  const seconds = parseFloat(formData['pauseSecond']) || 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  const temperature = parseFloat(formData['pauseTemperature'])

  let wait = true
  if (formData['pauseForAmountOfTime'] === PAUSE_UNTIL_TEMP) {
    wait = temperature // TODO: differentiate between seconds and temperature in step generation
  } else if (formData['pauseForAmountOfTime'] === PAUSE_UNTIL_TIME) {
    wait = totalSeconds
  }

  const message = formData['pauseMessage'] || ''

  return {
    commandCreatorFnName: 'delay',
    name: `Pause ${formData.id}`, // TODO real name for steps
    description: 'description would be here 2018-03-01', // TODO get from form
    wait,
    message,
    meta: {
      hours,
      minutes,
      seconds,
    },
  }
}

export default pauseFormToArgs
