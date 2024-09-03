import mapValues from 'lodash/mapValues'
import { castField } from '../../../steplist/fieldLevel'
import { mixFormToArgs } from './mixFormToArgs'
import { pauseFormToArgs } from './pauseFormToArgs'
import { magnetFormToArgs } from './magnetFormToArgs'
import { temperatureFormToArgs } from './temperatureFormToArgs'
import { thermocyclerFormToArgs } from './thermocyclerFormToArgs'
import { heaterShakerFormToArgs } from './heaterShakerFormToArgs'
import { moveLiquidFormToArgs } from './moveLiquidFormToArgs'
import { moveLabwareFormToArgs } from './moveLabwareFormToArgs'
import { commentFormToArgs } from './commentFormToArgs'
import type { CommandCreatorArgs } from '@opentrons/step-generation'
import type {
  FormData,
  HydratedCommentFormData,
  HydratedHeaterShakerFormData,
  HydratedMagnetFormData,
  HydratedMixFormDataLegacy,
  HydratedMoveLabwareFormData,
  HydratedMoveLiquidFormData,
  HydratedTemperatureFormData,
} from '../../../form-types'
// NOTE: this acts as an adapter for the PD defined data shape of the step forms
// to create arguments that the step generation service is expecting
// in order to generate command creators
type StepArgs = CommandCreatorArgs | null
// cast all fields that have 'castValue' in stepFieldHelperMap
export const _castForm = (hydratedForm: FormData): any =>
  mapValues(hydratedForm, (value, name) => castField(name, value))
// TODO: Ian 2019-01-29 use hydrated form type
export const stepFormToArgs = (hydratedForm: FormData): StepArgs => {
  const castForm = _castForm(hydratedForm)
  switch (castForm.stepType) {
    case 'moveLiquid': {
      const moveLiquidFormData: HydratedMoveLiquidFormData = {
        ...castForm,
        fields: castForm,
      }
      return moveLiquidFormToArgs(moveLiquidFormData)
    }

    // TODO: Ian 2019-01-29 nest all fields under `fields` (in #2917 ?)
    case 'pause':
      return pauseFormToArgs(castForm as FormData)

    case 'mix':
      return mixFormToArgs(castForm as HydratedMixFormDataLegacy)

    case 'magnet':
      return magnetFormToArgs(castForm as HydratedMagnetFormData)

    case 'temperature':
      return temperatureFormToArgs(castForm as HydratedTemperatureFormData)

    case 'thermocycler':
      return thermocyclerFormToArgs(castForm as FormData)

    case 'heaterShaker':
      return heaterShakerFormToArgs(castForm as HydratedHeaterShakerFormData)

    case 'moveLabware': {
      const moveLabwareFormData: HydratedMoveLabwareFormData = {
        ...castForm,
        fields: castForm,
      }
      return moveLabwareFormToArgs(moveLabwareFormData)
    }

    case 'comment': {
      const commentFormData: HydratedCommentFormData = {
        ...castForm,
        fields: castForm,
      }
      return commentFormToArgs(commentFormData)
    }

    default:
      console.warn(`stepFormToArgs not implemented for ${castForm.stepType}`)
      return null
  }
}
