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
  castFormData: GetCastFormData<HydratedMoveLiquidFormData>
  secondsField: DelaySecondsMoveLiquidFields
  checkboxField?: DelayCheckboxMoveLiquidFields
}): InnerDelayArgs | null => {
  const { castFormData: hydratedFormData, checkboxField, secondsField } = args
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
  castFormData: GetCastFormData<HydratedMixFormData>,
  checkboxField: DelayCheckboxBaseFields,
  secondsField: DelaySecondsBaseFields
): number | null => {
  const checkbox = castFormData[checkboxField]
  const seconds = castFormData[secondsField]

  if (checkbox && typeof seconds === 'number' && seconds > 0) {
    return seconds
  }

  return null
}
