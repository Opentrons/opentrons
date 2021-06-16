import {
  FormError,
  composeErrors,
  incompatibleAspirateLabware,
  incompatibleDispenseLabware,
  incompatibleLabware,
  pauseForTimeOrUntilTold,
  wellRatioMoveLiquid,
  magnetActionRequired,
  engageHeightRequired,
  engageHeightRangeExceeded,
  moduleIdRequired,
  targetTemperatureRequired,
  blockTemperatureRequired,
  lidTemperatureRequired,
  profileVolumeRequired,
  profileTargetLidTempRequired,
  blockTemperatureHoldRequired,
  lidTemperatureHoldRequired,
  volumeTooHigh,
} from './errors'

import {
  FormWarning,
  FormWarningType,
  composeWarnings,
  belowPipetteMinimumVolume,
  maxDispenseWellVolume,
  minDisposalVolume,
  minAspirateAirGapVolume,
  minDispenseAirGapVolume,
} from './warnings'

import { StepType } from '../../form-types'
export { handleFormChange } from './handleFormChange'
export { createBlankForm } from './createBlankForm'
export { getDefaultsForStepType } from './getDefaultsForStepType'
export { getDisabledFields } from './getDisabledFields'
export { getNextDefaultPipetteId } from './getNextDefaultPipetteId'
export {
  getNextDefaultTemperatureModuleId,
  getNextDefaultThermocyclerModuleId,
} from './getNextDefaultModuleId'
export { getNextDefaultMagnetAction } from './getNextDefaultMagnetAction'
export { getNextDefaultEngageHeight } from './getNextDefaultEngageHeight'
export { stepFormToArgs } from './stepFormToArgs'
export type { FormError, FormWarning, FormWarningType }
interface FormHelpers {
  getErrors?: (arg: unknown) => FormError[]
  getWarnings?: (arg: unknown) => FormWarning[]
}
type StepTypesWithErrorChecking = Exclude<StepType, 'manualIntervention'>
const stepFormHelperMap: Record<StepTypesWithErrorChecking, FormHelpers> = {
  mix: {
    getErrors: composeErrors(incompatibleLabware, volumeTooHigh),
    getWarnings: composeWarnings(belowPipetteMinimumVolume),
  },
  pause: {
    getErrors: composeErrors(pauseForTimeOrUntilTold),
  },
  moveLiquid: {
    getErrors: composeErrors(
      incompatibleAspirateLabware,
      incompatibleDispenseLabware,
      wellRatioMoveLiquid
    ),
    getWarnings: composeWarnings(
      belowPipetteMinimumVolume,
      maxDispenseWellVolume,
      minDisposalVolume,
      minAspirateAirGapVolume,
      minDispenseAirGapVolume
    ),
  },
  magnet: {
    getErrors: composeErrors(
      magnetActionRequired,
      engageHeightRequired,
      moduleIdRequired,
      engageHeightRangeExceeded
    ),
  },
  temperature: {
    getErrors: composeErrors(targetTemperatureRequired, moduleIdRequired),
  },
  thermocycler: {
    getErrors: composeErrors(
      blockTemperatureRequired,
      lidTemperatureRequired,
      profileVolumeRequired,
      profileTargetLidTempRequired,
      blockTemperatureHoldRequired,
      lidTemperatureHoldRequired
    ),
  },
}
export const getFormErrors = (
  stepType: StepTypesWithErrorChecking,
  formData: unknown
): FormError[] => {
  const formErrorGetter =
    stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getErrors
  const errors = formErrorGetter != null ? formErrorGetter(formData) : []
  return errors
}
export const getFormWarnings = (
  stepType: StepTypesWithErrorChecking,
  formData: unknown
): FormWarning[] => {
  const formWarningGetter =
    stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getWarnings
  const warnings = formWarningGetter != null ? formWarningGetter(formData) : []
  return warnings
}
