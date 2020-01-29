// @flow
import {
  composeErrors,
  incompatibleAspirateLabware,
  incompatibleDispenseLabware,
  incompatibleLabware,
  pauseForTimeOrUntilTold,
  wellRatioMoveLiquid,
  magnetActionRequired,
  engageHeightRequired,
  type FormError,
  moduleIdRequired,
  targetTemperatureRequired,
} from './errors'
import {
  composeWarnings,
  belowPipetteMinimumVolume,
  maxDispenseWellVolume,
  minDisposalVolume,
  engageHeightRangeExceeded,
  temperatureRangeExceeded,
  type FormWarning,
  type FormWarningType,
} from './warnings'
import type { StepType } from '../../form-types'

export { handleFormChange } from './handleFormChange'
export { generateNewForm } from './generateNewForm'
export { getDefaultsForStepType } from './getDefaultsForStepType'
export { getDisabledFields } from './getDisabledFields'
export { getNextDefaultPipetteId } from './getNextDefaultPipetteId'
export { getNextDefaultTemperatureModuleId } from './getNextDefaultModuleId'
export { getNextDefaultMagnetAction } from './getNextDefaultMagnetAction'
export { getNextDefaultEngageHeight } from './getNextDefaultEngageHeight'
export { stepFormToArgs } from './stepFormToArgs'

type FormHelpers = {
  getErrors?: mixed => Array<FormError>,
  getWarnings?: mixed => Array<FormWarning>,
}
const stepFormHelperMap: { [StepType]: FormHelpers } = {
  mix: {
    getErrors: composeErrors(incompatibleLabware),
    getWarnings: composeWarnings(belowPipetteMinimumVolume),
  },
  pause: { getErrors: composeErrors(pauseForTimeOrUntilTold) },
  moveLiquid: {
    getErrors: composeErrors(
      incompatibleAspirateLabware,
      incompatibleDispenseLabware,
      wellRatioMoveLiquid
    ),
    getWarnings: composeWarnings(
      belowPipetteMinimumVolume,
      maxDispenseWellVolume,
      minDisposalVolume
    ),
  },
  magnet: {
    getErrors: composeErrors(magnetActionRequired, engageHeightRequired),
    getWarnings: composeWarnings(engageHeightRangeExceeded),
  },
  temperature: {
    moduleId: composeErrors(moduleIdRequired),
    getErrors: composeErrors(targetTemperatureRequired),
    getWarnings: composeWarnings(temperatureRangeExceeded),
  },
}

export type { FormError, FormWarning, FormWarningType }

export const getFormErrors = (
  stepType: StepType,
  formData: mixed
): Array<FormError> => {
  const formErrorGetter =
    stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getErrors
  const errors = formErrorGetter ? formErrorGetter(formData) : []
  return errors
}

export const getFormWarnings = (
  stepType: StepType,
  formData: mixed
): Array<FormWarning> => {
  const formWarningGetter =
    stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getWarnings
  const warnings = formWarningGetter ? formWarningGetter(formData) : []
  return warnings
}
