// @flow
import get from 'lodash/get'
import {} from './errors'
import {composeWarnings, maxWellVolume} from './warnings'
import type {StepType} from '../../form-types'

type FormHelpers = {getErrors?: (mixed) => Array<string>, getWarnings?: (mixed) => Array<string>}
const StepFormHelperMap: {[StepType]: FormHelpers} = {
  mix: {getErrors: () => {}, getWarnings: () => {}},
  pause: {getErrors: () => {}, getWarnings: () => {}},
  transfer: {getErrors: () => {}, getWarnings: composeWarnings(maxWellVolume)},
  consolidate: {getErrors: () => {}, getWarnings: composeWarnings(maxWellVolume)},
  distribute: {getErrors: () => {}, getWarnings: composeWarnings(maxWellVolume)}
}

export const getFormErrors = (stepType: StepType, formData: mixed): Array<string> => {
  const formErrorGetter: (mixed) => Array<string> = get(StepFormHelperMap, `${stepType}.getErrors`)
  const errors: Array<string> = formErrorGetter ? formErrorGetter(formData) : []
  return errors
}

export const getFormWarnings = (stepType: StepType, formData: mixed): Array<string> => {
  const formWarningGetter: (mixed) => Array<string> = get(StepFormHelperMap, `${stepType}.getWarnings`)
  const warnings: Array<string> = formWarningGetter ? formWarningGetter(formData) : []
  // TODO: filter out dismissed warnings here
  return warnings
}
