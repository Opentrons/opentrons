// @flow
import get from 'lodash/get'
import {
  composeErrors,
  incompatibleAspirateLabware,
  incompatibleDispenseLabware,
  incompatibleLabware,
  wellRatioTransfer,
  wellRatioConsolidate,
  wellRatioDistribute,
  type FormError
} from './errors'
import {
  composeWarnings,
  maxDispenseWellVolume,
  minDisposalVolume,
  type FormWarning,
  type FormWarningKey
} from './warnings'
import type {StepType} from '../../form-types'

type FormHelpers = {getErrors?: (mixed) => Array<FormError>, getWarnings?: (mixed) => Array<FormWarning>}
const StepFormHelperMap: {[StepType]: FormHelpers} = {
  mix: {getErrors: composeErrors(incompatibleLabware)},
  pause: {getErrors: composeErrors(incompatibleLabware)},
  transfer: {
    getErrors: composeErrors(incompatibleAspirateLabware, incompatibleDispenseLabware, wellRatioTransfer),
    getWarnings: composeWarnings(maxDispenseWellVolume)
  },
  consolidate: {
    getErrors: composeErrors(incompatibleAspirateLabware, incompatibleDispenseLabware, wellRatioConsolidate),
    getWarnings: composeWarnings(maxDispenseWellVolume)
  },
  distribute: {
    getErrors: composeErrors(incompatibleAspirateLabware, incompatibleDispenseLabware, wellRatioDistribute),
    getWarnings: composeWarnings(maxDispenseWellVolume, minDisposalVolume)
  }
}

export type {FormError, FormWarning, FormWarningKey}

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
