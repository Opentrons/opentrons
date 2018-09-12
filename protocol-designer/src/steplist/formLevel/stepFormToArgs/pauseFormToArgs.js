// @flow

import type { FormData } from '../../../form-types'
import type { PauseFormData } from '../../../step-generation'

type ValidationAndErrors<F> = {
  errors: {[string]: string},
  validatedForm: F | null,
}

const pauseFormToArgs = (formData: FormData): ValidationAndErrors<PauseFormData> => {
  const hours = parseFloat(formData['pauseHour']) || 0
  const minutes = parseFloat(formData['pauseMinute']) || 0
  const seconds = parseFloat(formData['pauseSecond']) || 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds

  const message = formData['pauseMessage'] || ''

  // TODO: BC 2018-08-21 remove this old validation logic once no longer preventing save
  let errors = {}
  if (!formData['pauseForAmountOfTime']) {
    errors = {...errors, 'pauseForAmountOfTime': 'Pause for amount of time vs pause until user input is required'}
  }
  if (formData['pauseForAmountOfTime'] === 'true' && (totalSeconds <= 0)) {
    errors = {...errors, '_pause-times': 'Must include hours, minutes, or seconds'}
  }
  const hasErrors = Object.values(errors).length > 0

  return {
    errors,
    validatedForm: hasErrors
      ? null
      : {
        stepType: 'pause',
        name: `Pause ${formData.id}`, // TODO real name for steps
        description: 'description would be here 2018-03-01', // TODO get from form
        wait: (formData['pauseForAmountOfTime'] === 'false')
          ? true
          : totalSeconds,
        message,
        meta: {
          hours,
          minutes,
          seconds,
        },
      },
  }
}

export default pauseFormToArgs
