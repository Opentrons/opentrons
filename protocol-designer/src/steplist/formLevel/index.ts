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

import { HydratedFormdata, StepType } from '../../form-types'
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
  getErrors?: (arg: HydratedFormdata) => FormError[]
  getWarnings?: (arg: unknown) => FormWarning[]
}
const stepFormHelperMap: Partial<Record<StepType, FormHelpers>> = {
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
  stepType: StepType,
  formData: HydratedFormdata
): FormError[] => {
  const formErrorGetter =
    // @ts-expect-error(sa, 2021-6-20): not a valid type narrow
    stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getErrors
  const errors = formErrorGetter != null ? formErrorGetter(formData) : []
  return errors
}
export const getFormWarnings = (
  stepType: StepType,
  formData: unknown
): FormWarning[] => {
  const formWarningGetter =
    // @ts-expect-error(sa, 2021-6-20): not a valid type narrow
    stepFormHelperMap[stepType] && stepFormHelperMap[stepType].getWarnings
  const warnings = formWarningGetter != null ? formWarningGetter(formData) : []
  return warnings
}
