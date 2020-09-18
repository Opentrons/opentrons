// @flow
import type { InnerDelayArgs } from '../../../step-generation'

export function getDelayData<F: any>(
  hydratedFormData: F,
  checkboxField: 'aspirate_delay_checkbox' | 'dispense_delay_checkbox',
  secondsField: 'aspirate_delay_seconds' | 'dispense_delay_seconds',
  mmFromBottomField:
    | 'aspirate_delay_mmFromBottom'
    | 'dispense_delay_mmFromBottom'
    | 'mix_aspirate_delay_mmFromBottom'
    | 'mix_dispense_delay_mmFromBottom'
): InnerDelayArgs | null {
  const checkbox = hydratedFormData[checkboxField]
  const seconds = hydratedFormData[secondsField]
  const mmFromBottom = hydratedFormData[mmFromBottomField]

  if (
    checkbox &&
    (typeof seconds === 'number' && seconds > 0) &&
    (typeof mmFromBottom === 'number' && mmFromBottom > 0)
  ) {
    return { seconds, mmFromBottom }
  }
  return null
}
