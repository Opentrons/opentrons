// @flow
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
  type FormWarningType
} from './warnings'
import type {StepType} from '../../form-types'

type FormHelpers = {getErrors?: (mixed) => Array<FormError>, getWarnings?: (mixed) => Array<FormWarning>}
const stepFormHelperMap: {[StepType]: FormHelpers} = {
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

export type {FormError, FormWarning, FormWarningType}

export const getFormErrors = (stepType: StepType, formData: mixed): Array<FormError> => {
  const formErrorGetter = stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getErrors
  const errors = formErrorGetter ? formErrorGetter(formData) : []
  return errors
}

export const getFormWarnings = (stepType: StepType, formData: mixed): Array<FormWarning> => {
  const formWarningGetter = stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getWarnings
  const warnings = formWarningGetter ? formWarningGetter(formData) : []
  return warnings
}
