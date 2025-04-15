import { getDefaultMmFromEdge } from '../../../components/organisms/TipPositionModal/utils'
import type { InnerDelayArgs } from '@opentrons/step-generation'
import type {
  DelayCheckboxBaseFields,
  DelayCheckboxMoveLiquidFields,
  HydratedMoveLiquidFormData,
  HydratedMixFormData,
  DelaySecondsBaseFields,
  DelaySecondsMoveLiquidFields,
} from '../../../form-types'
export function getMoveLiquidDelayData(args: {
  hydratedFormData: HydratedMoveLiquidFormData
  secondsField: DelaySecondsMoveLiquidFields
  xPositionField:
    | 'aspirate_x_position'
    | 'dispense_x_position'
    | 'aspirate_submerge_x_position'
    | 'dispense_submerge_x_position'
    | 'aspirate_retract_x_position'
    | 'dispense_retract_x_position'
  yPositionField:
    | 'aspirate_y_position'
    | 'dispense_y_position'
    | 'aspirate_submerge_y_position'
    | 'dispense_submerge_y_position'
    | 'aspirate_retract_y_position'
    | 'dispense_retract_y_position'
  zPositionField:
    | 'aspirate_mmFromBottom'
    | 'dispense_mmFromBottom'
    | 'aspirate_submerge_mmFromBottom'
    | 'dispense_submerge_mmFromBottom'
    | 'aspirate_retract_mmFromBottom'
    | 'dispense_retract_mmFromBottom'
  checkboxField?: DelayCheckboxMoveLiquidFields
}): InnerDelayArgs | null {
  const {
    hydratedFormData,
    checkboxField,
    secondsField,
    xPositionField,
    yPositionField,
    zPositionField,
  } = args
  const checkbox =
    checkboxField != null ? hydratedFormData[checkboxField] : true
  const seconds = hydratedFormData[secondsField]
  let mmFromBottom: number | undefined
  const xOffset = hydratedFormData[xPositionField]
  const yOffset = hydratedFormData[yPositionField]
  const mmFromBottomFormValue = hydratedFormData[zPositionField]

  if (typeof mmFromBottomFormValue === 'number') {
    mmFromBottom = mmFromBottomFormValue
  } else if (mmFromBottomFormValue === null) {
    mmFromBottom = getDefaultMmFromEdge({
      name: zPositionField,
    })
  }
  if (
    checkbox &&
    typeof seconds === 'number' &&
    seconds > 0 &&
    typeof mmFromBottom === 'number' &&
    typeof xOffset === 'number' &&
    typeof yOffset === 'number'
  ) {
    return {
      seconds,
      mmFromBottom,
      xOffset,
      yOffset,
    }
  }

  return null
}
export function getMixDelayData(
  hydratedFormData: HydratedMixFormData,
  checkboxField: DelayCheckboxBaseFields,
  secondsField: DelaySecondsBaseFields
): number | null {
  const checkbox = hydratedFormData[checkboxField]
  const seconds = hydratedFormData[secondsField]

  if (checkbox && typeof seconds === 'number' && seconds > 0) {
    return seconds
  }

  return null
}
