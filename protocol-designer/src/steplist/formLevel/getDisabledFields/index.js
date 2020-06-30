// @flow
import { defaultMemoize } from 'reselect'
import type { FormData } from '../../../form-types'
import { getDisabledFieldsMoveLiquidForm } from './getDisabledFieldsMoveLiquidForm'
import { getDisabledFieldsMixForm } from './getDisabledFieldsMixForm'

function _getDisabledFields(rawForm: FormData): Set<string> {
  switch (rawForm.stepType) {
    case 'moveLiquid':
      return getDisabledFieldsMoveLiquidForm(rawForm)
    case 'mix':
      return getDisabledFieldsMixForm(rawForm)
    case 'pause':
    case 'magnet':
    case 'thermocycler':
      return new Set() // nothing to disabled
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
  rawForm: FormData
) => Set<string> = defaultMemoize(_getDisabledFields)
