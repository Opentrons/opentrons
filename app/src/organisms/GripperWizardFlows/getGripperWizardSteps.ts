import { FLOWS, SECTIONS } from './constants'
import type { GripperWizardStep, GripperWizardFlowType } from './types'

export const getGripperWizardSteps = (
  flowType: GripperWizardFlowType,
): GripperWizardStep[] => {
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,
          flowType: flowType,
        },
        { section: SECTIONS.ATTACH_PROBE, flowType: flowType },
        { section: SECTIONS.DETACH_PROBE, flowType: flowType },
        { section: SECTIONS.RESULTS, flowType: flowType },
      ]
    }
    case FLOWS.ATTACH: {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,

          flowType: flowType,
        },
        { section: SECTIONS.MOUNT_GRIPPER, flowType: flowType },
        { section: SECTIONS.RESULTS, flowType: flowType },
      ]
    }
    case FLOWS.DETACH: {
      return [
        {
          section: SECTIONS.BEFORE_BEGINNING,

          flowType: flowType,
        },
        { section: SECTIONS.DETACH_GRIPPER, flowType: flowType },
        { section: SECTIONS.RESULTS, flowType: flowType },
      ]
    }
  }
  return []
}
