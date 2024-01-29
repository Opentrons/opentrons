import { defaultMemoize } from 'reselect'
import { getDisabledFieldsMoveLiquidForm } from './getDisabledFieldsMoveLiquidForm'
import { getDisabledFieldsMixForm } from './getDisabledFieldsMixForm'
import { getDisabledFieldsHeaterShaker } from './getDisabledFieldsHeaterShaker'
import type { HydratedFormdata } from '../../../form-types'

function _getDisabledFields(hydratedForm: HydratedFormdata): Set<string> {
  switch (hydratedForm.stepType) {
    case 'moveLiquid':
      return getDisabledFieldsMoveLiquidForm(hydratedForm)

    case 'mix':
      return getDisabledFieldsMixForm(hydratedForm)

    case 'heaterShaker':
      return getDisabledFieldsHeaterShaker(hydratedForm)

    case 'pause':
    case 'magnet':
    case 'thermocycler':
    case 'moveLabware':
      return new Set()

    // nothing to disabled
    default: {
      console.warn(
        `disabled fields for step type ${hydratedForm.stepType} not yet implemented!`
      )
      return new Set()
    }
  }
}

// shallow-memoized because every disable-able field in the form calls this function once
// WARNING: do not mutate the same rawForm obj or this memoization will break
export const getDisabledFields: (
  hydratedForm: HydratedFormdata
) => Set<string> = defaultMemoize(_getDisabledFields)
