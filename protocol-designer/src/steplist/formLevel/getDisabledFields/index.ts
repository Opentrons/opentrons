import { defaultMemoize } from 'reselect'
import { getDisabledFieldsMoveLiquidForm } from './getDisabledFieldsMoveLiquidForm'
import { getDisabledFieldsMixForm } from './getDisabledFieldsMixForm'
import { getDisabledFieldsHeaterShaker } from './getDisabledFieldsHeaterShaker'
import { FormData } from '../../../form-types'
import { PipetteEntities } from '@opentrons/step-generation'

function _getDisabledFields(
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): Set<string> {
  switch (rawForm.stepType) {
    case 'moveLiquid':
      return getDisabledFieldsMoveLiquidForm(rawForm, pipetteEntities)

    case 'mix':
      return getDisabledFieldsMixForm(rawForm)

    case 'heaterShaker':
      return getDisabledFieldsHeaterShaker(rawForm)

    case 'pause':
    case 'magnet':
    case 'thermocycler':
    case 'moveLabware':
      return new Set()

    // nothing to disabled
    default: {
      console.warn(
        `disabled fields for step type ${rawForm.stepType} not yet implemented!`
      )
      return new Set()
    }
  }
}

// shallow-memoized because every disable-able field in the form calls this function once
// WARNING: do not mutate the same rawForm obj or this memoization will break
export const getDisabledFields: (
  rawForm: FormData,
  pipetteEntities: PipetteEntities
) => Set<string> = defaultMemoize(_getDisabledFields)
