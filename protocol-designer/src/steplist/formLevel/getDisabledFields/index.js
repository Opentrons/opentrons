// @flow
import getDisabledFieldsMoveLiquidForm from './getDisabledFieldsMoveLiquidForm'
import type {FormData} from '../../../form-types'

// TODO: Ian 2019-01-28 perf: this fn could be memoized
export default function getDisabledFields (rawForm: FormData): Set<string> {
  switch (rawForm.stepType) {
    case 'moveLiquid': return getDisabledFieldsMoveLiquidForm(rawForm)
    default: {
      console.warn(`disabled fields for step type ${rawForm.stepType} not yet implemented!`)
      return new Set()
    }
  }
}
