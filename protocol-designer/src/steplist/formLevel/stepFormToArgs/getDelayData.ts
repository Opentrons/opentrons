import type { InnerDelayArgs } from '@opentrons/step-generation'
import type {
  DelayCheckboxBaseFields,
  DelayCheckboxMoveLiquidFields,
  DelaySecondsBaseFields,
  DelaySecondsMoveLiquidFields,
  HydratedMixFormData,
  HydratedMoveLiquidFormData,
} from '../../../form-types'

export const getMoveLiquidDelayData = (args: {
  hydratedFormData: HydratedMoveLiquidFormData
  secondsField: DelaySecondsMoveLiquidFields
  checkboxField?: DelayCheckboxMoveLiquidFields
}): InnerDelayArgs | null => {
  const { hydratedFormData, checkboxField, secondsField } = args
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
  hydratedFormData: HydratedMixFormData,
  checkboxField: DelayCheckboxBaseFields,
  secondsField: DelaySecondsBaseFields
): number | null => {
  const checkbox = hydratedFormData[checkboxField]
  const seconds = hydratedFormData[secondsField]

  if (checkbox && typeof seconds === 'number' && seconds > 0) {
    return seconds
  }

  return null
}
