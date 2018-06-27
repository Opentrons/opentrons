// @flow
import get from 'lodash/get'
import {} from './errors'
import type {StepFieldName} from '../fieldLevel'
import type {StepType} from '../../form-types'

const StepFormHelperMap: {[StepType]: {getErrors?: (mixed) => Array<string>}} = {
  mix: {getErrors: () => {}},
  pause: {getErrors: () => {}},
  transfer: {getErrors: () => {}},
  consolidate: {getErrors: () => {}},
  distribute: {getErrors: () => {}}
}

export const getFormErrors = (name: StepFieldName, value: mixed): Array<string> => {
  const fieldErrorGetter: (mixed) => Array<string> = get(StepFormHelperMap, `${name}.getErrors`)
  const errors: Array<string> = fieldErrorGetter ? fieldErrorGetter(value) : []
  return errors
}
