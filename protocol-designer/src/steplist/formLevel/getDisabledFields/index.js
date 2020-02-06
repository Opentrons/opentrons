// @flow
import { defaultMemoize } from 'reselect'
import getDisabledFieldsMoveLiquidForm from './getDisabledFieldsMoveLiquidForm'
import getDisabledFieldsMixForm from './getDisabledFieldsMixForm'
import type { FormData } from '../../../form-types'

function _getDisabledFields(rawForm: FormData): Set<string> {
  switch (rawForm.stepType) {
    case 'moveLiquid':
      return getDisabledFieldsMoveLiquidForm(rawForm)
    case 'mix':
      return getDisabledFieldsMixForm(rawForm)
    case 'pause':
      return new Set() // nothing to disabled
    case 'magnet':
      return new Set()
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
const getDisabledFields = defaultMemoize(_getDisabledFields)

export default getDisabledFields
