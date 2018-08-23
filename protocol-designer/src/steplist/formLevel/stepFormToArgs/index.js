// @flow

import type { FormData } from '../../../form-types'
import type { CommandCreatorData } from '../../../step-generation'
import mixFormToArgs from './mixFormToArgs'
import pauseFormToArgs from './pauseFormToArgs'
import transferLikeFormToArgs from './transferLikeFormToArgs'
import type { StepFormContext } from './types'

export type ValidFormAndErrors = {
  errors: {[string]: string},
  validatedForm: CommandCreatorData | null // TODO: incompleteData field when this is null?
}

// NOTE: this acts as an adapter for the PD defined data shape of the step forms
// to create arguments that the step generation service is expecting
// in order to generate command creators

const stepFormToArgs = (formData: FormData, context: StepFormContext): * => { // really returns ValidFormAndErrors
  switch (formData.stepType) {
    case 'transfer':
    case 'consolidate':
    case 'distribute':
      return transferLikeFormToArgs(formData, context)
    case 'pause':
      return pauseFormToArgs(formData, context)
    case 'mix':
      return mixFormToArgs(formData, context)
    default:
      return {
        errors: {_form: `Unsupported step type: ${formData.stepType}`},
        validatedForm: null
      }
  }
}

export default stepFormToArgs
