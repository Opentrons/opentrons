import type { InnerDelayArgs } from '@opentrons/step-generation'
import type {
  DelayCheckboxBaseFields,
  DelayCheckboxMoveLiquidFields,
  DelaySecondsBaseFields,
  DelaySecondsMoveLiquidFields,
  HydratedMixFormData,
  HydratedMoveLiquidFormData,
} from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const getMoveLiquidDelayData = (args: {
  formData: GetCastFormData<HydratedMoveLiquidFormData>
  secondsField: DelaySecondsMoveLiquidFields
  checkboxField?: DelayCheckboxMoveLiquidFields
}): InnerDelayArgs | null => {
  const { formData: hydratedFormData, checkboxField, secondsField } = args
  const checkbox =
    checkboxField != null ? hydratedFormData[checkboxField] ?? false : true
  const seconds = hydratedFormData[secondsField] ?? 0

  if (checkbox && seconds > 0) {
    return {
      seconds,
    }
  }

  return null
}

export const getMixDelayData = (
  formData: GetCastFormData<HydratedMixFormData>,
  checkboxField: DelayCheckboxBaseFields,
  secondsField: DelaySecondsBaseFields
): number | null => {
  const checkbox = formData[checkboxField]
  const seconds = formData[secondsField]

  if (checkbox && typeof seconds === 'number' && seconds > 0) {
    return seconds
  }

  return null
}
