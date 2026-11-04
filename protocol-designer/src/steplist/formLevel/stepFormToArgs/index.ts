import mapValues from 'lodash/mapValues'

import { castField } from '../../../steplist/fieldLevel'
import { absorbanceReaderFormToArgs } from './absorbanceReaderFormToArgs'
import { cameraFormToArgs } from './cameraFormToArgs'
import { commentFormToArgs } from './commentFormToArgs'
import { flexStackerFormToArgs } from './flexStackerFormToArgs'
import { heaterShakerFormToArgs } from './heaterShakerFormToArgs'
import { magnetFormToArgs } from './magnetFormToArgs'
import { mixFormToArgs } from './mixFormToArgs'
import { moveLabwareFormToArgs } from './moveLabwareFormToArgs'
import { moveLiquidFormToArgs } from './moveLiquidFormToArgs'
import { pauseFormToArgs } from './pauseFormToArgs'
import { temperatureFormToArgs } from './temperatureFormToArgs'
import { thermocyclerFormToArgs } from './thermocyclerFormToArgs'
import { vacuumFormToArgs } from './vacuumFormToArgs'

import type {
  CommandCreatorArgs,
  InvariantContext,
} from '@opentrons/step-generation'
import type { HydratedFormData } from '../../../form-types'
import type { GetCastFormData } from '../../../steplist/fieldLevel'

// NOTE: this acts as an adapter for the PD defined data shape of the step forms
// to create arguments that the step generation service is expecting
// in order to generate command creators
type StepArgs = CommandCreatorArgs | null
export function _castForm<HydratedFormDataT extends HydratedFormData>(
  hydratedForm: HydratedFormDataT
): GetCastFormData<HydratedFormDataT> {
  // @ts-expect-error - todo(mm, 2025-10-09) See if TypeScript can be made to understand this.
  return mapValues(hydratedForm, (value, name) => castField(name, value))
}

export const stepFormToArgs = (
  hydratedForm: HydratedFormData,
  contextualState: InvariantContext
): StepArgs => {
  const castForm = _castForm(hydratedForm)
  let stepArgs: StepArgs = null
  switch (hydratedForm.stepType) {
    case 'moveLiquid': {
      stepArgs = moveLiquidFormToArgs(_castForm(hydratedForm), contextualState)
      break
    }
    case 'pause': {
      stepArgs = pauseFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'mix': {
      stepArgs = mixFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'magnet': {
      stepArgs = magnetFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'temperature': {
      stepArgs = temperatureFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'thermocycler': {
      stepArgs = thermocyclerFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'heaterShaker': {
      stepArgs = heaterShakerFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'moveLabware': {
      stepArgs = moveLabwareFormToArgs(_castForm(hydratedForm))

      break
    }
    case 'camera': {
      stepArgs = cameraFormToArgs(_castForm(hydratedForm))

      break
    }
    case 'comment': {
      stepArgs = commentFormToArgs(_castForm(hydratedForm))

      break
    }
    case 'absorbanceReader': {
      stepArgs = absorbanceReaderFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'flexStacker': {
      stepArgs = flexStackerFormToArgs(_castForm(hydratedForm))
      break
    }
    case 'vacuum': {
      stepArgs = vacuumFormToArgs(_castForm(hydratedForm))
      break
    }
  }

  if (stepArgs == null) {
    console.warn(`stepFormToArgs not implemented for ${castForm.stepType}`)
    return null
  }
  return {
    ...stepArgs,
    stepNumber: castForm.stepNumber,
    name: castForm.stepName,
    description: castForm.stepDetails,
  }
}
