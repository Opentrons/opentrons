import type { InnerDelayArgs } from "@opentrons/step-generation";
import type { DelayCheckboxFields, DelaySecondFields } from "../../../form-types";
export function getMoveLiquidDelayData<F extends any>(hydratedFormData: F, checkboxField: DelayCheckboxFields, secondsField: DelaySecondFields, mmFromBottomField: "aspirate_delay_mmFromBottom" | "dispense_delay_mmFromBottom"): InnerDelayArgs | null {
  const checkbox = hydratedFormData[checkboxField];
  const seconds = hydratedFormData[secondsField];
  const mmFromBottom = hydratedFormData[mmFromBottomField];

  if (checkbox && typeof seconds === 'number' && seconds > 0 && typeof mmFromBottom === 'number' && mmFromBottom > 0) {
    return {
      seconds,
      mmFromBottom
    };
  }

  return null;
}
export function getMixDelayData<F extends any>(hydratedFormData: F, checkboxField: DelayCheckboxFields, secondsField: DelaySecondFields): number | null {
  const checkbox = hydratedFormData[checkboxField];
  const seconds = hydratedFormData[secondsField];

  if (checkbox && typeof seconds === 'number' && seconds > 0) {
    return seconds;
  }

  return null;
}