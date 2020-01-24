// @flow
import mapValues from 'lodash/mapValues'
import { castField } from '../../../steplist/fieldLevel'
import { mixFormToArgs } from './mixFormToArgs'
import { pauseFormToArgs } from './pauseFormToArgs'
import { magnetFormToArgs } from './magnetFormToArgs'
import { temperatureFormToArgs } from './temperatureFormToArgs'
import { moveLiquidFormToArgs } from './moveLiquidFormToArgs'
import type { FormData } from '../../../form-types'
import type { CommandCreatorArgs } from '../../../step-generation'

// NOTE: this acts as an adapter for the PD defined data shape of the step forms
// to create arguments that the step generation service is expecting
// in order to generate command creators

type StepArgs = CommandCreatorArgs | null

// TODO: Ian 2019-01-29 use hydrated form type
export const stepFormToArgs = (hydratedForm: FormData): StepArgs => {
  // cast all fields that have 'fieldCaster' in stepFieldHelperMap
  const castForm = mapValues(hydratedForm, (value, name) =>
    castField(name, value)
  )

  switch (castForm.stepType) {
    case 'moveLiquid':
      return moveLiquidFormToArgs({ ...castForm, fields: castForm }) // TODO: Ian 2019-01-29 nest all fields under `fields` (in #2917 ?)
    case 'pause':
      return pauseFormToArgs(castForm)
    case 'mix':
      return mixFormToArgs(castForm)
    case 'magnet':
      return magnetFormToArgs(castForm)
    case 'temperature':
      return temperatureFormToArgs(castForm)
    default:
      console.warn(`stepFormToArgs not implemented for ${castForm.stepType}`)
      return null
  }
}
