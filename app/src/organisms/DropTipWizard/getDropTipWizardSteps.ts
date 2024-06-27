import { BLOWOUT_STEPS, DROP_TIP_STEPS } from './constants'
import type { DropTipWizardStep } from './types'

export const getDropTipWizardSteps = (
  shouldDispenseLiquid: boolean | null
): DropTipWizardStep[] => {
  if (shouldDispenseLiquid == null) {
    return []
  } else if (shouldDispenseLiquid) {
    return [...BLOWOUT_STEPS, ...DROP_TIP_STEPS]
  } else {
    return DROP_TIP_STEPS
  }
}
