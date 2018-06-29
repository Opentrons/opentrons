// @flow
import get from 'lodash/get'
import {
  composeErrors,
  incompatibleAspirateLabware,
  incompatibleDispenseLabware,
  incompatibleLabware,
  type FormError
} from './errors'
import {
  composeWarnings,
  maxDispenseWellVolume,
  type FormWarning
} from './warnings'
import type {StepType} from '../../form-types'

type FormHelpers = {getErrors?: (mixed) => Array<FormError>, getWarnings?: (mixed) => Array<FormWarning>}
const StepFormHelperMap: {[StepType]: FormHelpers} = {
  mix: {getErrors: composeErrors(incompatibleLabware), getWarnings: () => {}},
  pause: {getErrors: composeErrors(incompatibleLabware), getWarnings: () => {}},
  transfer: {
    getErrors: composeErrors(incompatibleAspirateLabware, incompatibleDispenseLabware),
    getWarnings: composeWarnings(maxDispenseWellVolume)
  },
  consolidate: {
    getErrors: composeErrors(incompatibleAspirateLabware, incompatibleDispenseLabware),
    getWarnings: composeWarnings(maxDispenseWellVolume)
  },
  distribute: {
    getErrors: composeErrors(incompatibleAspirateLabware, incompatibleDispenseLabware),
    getWarnings: composeWarnings(maxDispenseWellVolume)
  }
}

export type {FormError, FormWarning}

export const getFormErrors = (stepType: StepType, formData: mixed): Array<FormError> => {
  const formErrorGetter: (mixed) => Array<FormError> = get(StepFormHelperMap, `${stepType}.getErrors`)
  const errors: Array<FormError> = formErrorGetter ? formErrorGetter(formData) : []
  return errors
}

export const getFormWarnings = (stepType: StepType, formData: mixed): Array<FormWarning> => {
  const formWarningGetter: (mixed) => Array<FormWarning> = get(StepFormHelperMap, `${stepType}.getWarnings`)
  const warnings: Array<FormWarning> = formWarningGetter ? formWarningGetter(formData) : []
  // TODO: filter out dismissed warnings here
  return warnings
}
