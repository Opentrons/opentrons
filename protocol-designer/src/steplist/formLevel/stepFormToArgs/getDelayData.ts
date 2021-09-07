import { InnerDelayArgs } from '@opentrons/step-generation'
import {
  DelayCheckboxFields,
  DelaySecondFields,
  HydratedMoveLiquidFormData,
  HydratedMixFormDataLegacy,
} from '../../../form-types'
export function getMoveLiquidDelayData(
  hydratedFormData: HydratedMoveLiquidFormData['fields'],
  checkboxField: DelayCheckboxFields,
  secondsField: DelaySecondFields,
  mmFromBottomField:
    | 'aspirate_delay_mmFromBottom'
    | 'dispense_delay_mmFromBottom'
): InnerDelayArgs | null {
  const checkbox = hydratedFormData[checkboxField]
  const seconds = hydratedFormData[secondsField]
  const mmFromBottom = hydratedFormData[mmFromBottomField]

  if (
    checkbox &&
    typeof seconds === 'number' &&
    seconds > 0 &&
    typeof mmFromBottom === 'number' &&
    mmFromBottom > 0
  ) {
    return {
      seconds,
      mmFromBottom,
    }
  }

  return null
}
export function getMixDelayData(
  hydratedFormData: HydratedMixFormDataLegacy,
  checkboxField: DelayCheckboxFields,
  secondsField: DelaySecondFields
): number | null {
  const checkbox = hydratedFormData[checkboxField]
  const seconds = hydratedFormData[secondsField]

  if (checkbox && typeof seconds === 'number' && seconds > 0) {
    return seconds
  }

  return null
}
