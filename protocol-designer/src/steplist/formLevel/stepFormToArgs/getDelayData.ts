import { DEFAULT_MM_OFFSET_FROM_BOTTOM } from '../../../constants'

import type { InnerDelayArgs } from '@opentrons/step-generation'
import type {
  DelayCheckboxBaseFields,
  DelayCheckboxMoveLiquidFields,
  DelaySecondsBaseFields,
  DelaySecondsMoveLiquidFields,
  DelayZPositionFields,
  HydratedMixFormData,
  HydratedMoveLiquidFormData,
} from '../../../form-types'

export const getMoveLiquidDelayData = (args: {
  hydratedFormData: HydratedMoveLiquidFormData
  secondsField: DelaySecondsMoveLiquidFields
  zPositionField: DelayZPositionFields
  checkboxField?: DelayCheckboxMoveLiquidFields
}): InnerDelayArgs | null => {
  const { hydratedFormData, checkboxField, secondsField, zPositionField } = args
  const checkbox =
    checkboxField != null ? hydratedFormData[checkboxField] ?? false : true
  const seconds = hydratedFormData[secondsField] ?? 0
  const mmFromBottom =
    hydratedFormData[zPositionField] ?? DEFAULT_MM_OFFSET_FROM_BOTTOM

  if (checkbox && mmFromBottom >= 0 && seconds > 0) {
    return {
      seconds,
      mmFromBottom, // TODO (nd: 04/15/2025) remove once compound creators are finished. We no longer need the individual positions for a delay
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
