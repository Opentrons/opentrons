// @flow

import type {FormData} from '../../../form-types'
import type {CommandCreatorData} from '../../../step-generation'
import mixFormToArgs from './mixFormToArgs'
import pauseFormToArgs from './pauseFormToArgs'
import transferLikeFormToArgs from './transferLikeFormToArgs'
import moveLiquidFormToArgs from './moveLiquidFormToArgs'

// NOTE: this acts as an adapter for the PD defined data shape of the step forms
// to create arguments that the step generation service is expecting
// in order to generate command creators

type StepArgs = CommandCreatorData | null

// TODO: Ian 2019-01-29 use hydrated form type
const stepFormToArgs = (hydratedForm: FormData): StepArgs => {
  switch (hydratedForm.stepType) {
    case 'moveLiquid':
      return moveLiquidFormToArgs({...hydratedForm, fields: hydratedForm}) // TODO: Ian 2019-01-29 nest all fields under `fields` (in #2917 ?)
    case 'transfer':
    case 'consolidate':
    case 'distribute':
      return transferLikeFormToArgs(hydratedForm)
    case 'pause':
      return pauseFormToArgs(hydratedForm)
    case 'mix':
      return mixFormToArgs(hydratedForm)
    default:
      console.warn(`stepFormToArgs not implemented for ${hydratedForm.stepType}`)
      return null
  }
}

export default stepFormToArgs
