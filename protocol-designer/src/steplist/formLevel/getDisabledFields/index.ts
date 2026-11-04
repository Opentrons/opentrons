import { lruMemoize } from 'reselect'

import { getDisabledFieldsHeaterShaker } from './getDisabledFieldsHeaterShaker'
import { getDisabledFieldsMixForm } from './getDisabledFieldsMixForm'
import { getDisabledFieldsMoveLiquidForm } from './getDisabledFieldsMoveLiquidForm'

import type { HydratedFormData } from '../../../form-types'

function _getDisabledFields(hydratedForm: HydratedFormData): Set<string> {
  switch (hydratedForm.stepType) {
    case 'moveLiquid':
      return getDisabledFieldsMoveLiquidForm(hydratedForm)

    case 'mix':
      return getDisabledFieldsMixForm(hydratedForm)

    case 'heaterShaker':
      return getDisabledFieldsHeaterShaker(hydratedForm)

    case 'comment':
    case 'camera':
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
  hydratedForm: HydratedFormData
) => Set<string> = lruMemoize(_getDisabledFields)
