import { FLOWS, SECTIONS } from './constants'
import type { PipetteWizardStep, PipetteWizardFlow } from './types'
import type { PipetteMount } from '@opentrons/shared-data'

export const getPipetteWizardSteps = (
  flowType: PipetteWizardFlow,
  mount: PipetteMount
): PipetteWizardStep[] => {
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: flowType,
        },
        { section: SECTIONS.ATTACH_PROBE, mount: mount, flowType: flowType },
        { section: SECTIONS.DETACH_PROBE, mount: mount, flowType: flowType },
        { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
      ]
    }
    case FLOWS.ATTACH: {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: flowType,
        },
        { section: SECTIONS.MOUNT_PIPETTE, mount: mount, flowType: flowType },
        { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
      ]
    }
    case FLOWS.DETACH: {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          mount: mount,
          flowType: flowType,
        },
        { section: SECTIONS.DETACH_PIPETTE, mount: mount, flowType: flowType },
        { section: SECTIONS.RESULTS, mount: mount, flowType: flowType },
      ]
    }
  }
  return []
}
