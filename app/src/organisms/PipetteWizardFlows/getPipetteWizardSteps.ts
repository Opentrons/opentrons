import { FLOWS, SECTIONS } from './constants'
import type { PipetteWizardStep, PipetteWizardFlow } from './types'

export const getPipetteWizardSteps = (
  flowType: PipetteWizardFlow
): PipetteWizardStep[] => {
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.ATTACH_STEM },
        { section: SECTIONS.DETACH_STEM },
        { section: SECTIONS.RESULTS },
      ]
    }
  }
  return []
}
