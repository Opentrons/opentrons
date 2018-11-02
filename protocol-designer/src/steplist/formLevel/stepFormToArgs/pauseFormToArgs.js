// @flow

import type { FormData } from '../../../form-types'
import type { PauseFormData } from '../../../step-generation'

type PauseStepArgs = PauseFormData

const pauseFormToArgs = (formData: FormData): PauseStepArgs => {
  const hours = parseFloat(formData['pauseHour']) || 0
  const minutes = parseFloat(formData['pauseMinute']) || 0
  const seconds = parseFloat(formData['pauseSecond']) || 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds

  const message = formData['pauseMessage'] || ''

  return {
    stepType: 'pause',
    name: `Pause ${formData.id}`, // TODO real name for steps
    description: 'description would be here 2018-03-01', // TODO get from form
    wait: (formData['pauseForAmountOfTime'] === 'false') ? true : totalSeconds,
    message,
    meta: {
      hours,
      minutes,
      seconds,
    },
  }
}

export default pauseFormToArgs
