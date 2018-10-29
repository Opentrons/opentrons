// @flow

import type { FormData } from '../../../form-types'
import type {
  ConsolidateFormData,
  DistributeFormData,
  TransferFormData,
  MixFormData,
  PauseFormData,
} from '../../../step-generation'
import mixFormToArgs from './mixFormToArgs'
import pauseFormToArgs from './pauseFormToArgs'
import transferLikeFormToArgs from './transferLikeFormToArgs'

// NOTE: this acts as an adapter for the PD defined data shape of the step forms
// to create arguments that the step generation service is expecting
// in order to generate command creators

type StepArgs = ConsolidateFormData | DistributeFormData | TransferFormData | MixFormData | PauseFormData | null

const stepFormToArgs = (formData: FormData): StepArgs => {
  switch (formData.stepType) {
    case 'transfer':
    case 'consolidate':
    case 'distribute':
      return transferLikeFormToArgs(formData)
    case 'pause':
      return pauseFormToArgs(formData)
    case 'mix':
      return mixFormToArgs(formData)
    default:
      return null
  }
}

export default stepFormToArgs
