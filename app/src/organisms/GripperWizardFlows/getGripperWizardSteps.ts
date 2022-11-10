import { GRIPPER_FLOW_TYPES, SECTIONS } from './constants'
import type { GripperWizardStep, GripperWizardFlowType } from './types'

export const getGripperWizardSteps = (
  flowType: GripperWizardFlowType,
): GripperWizardStep[] => {
  switch (flowType) {
    case GRIPPER_FLOW_TYPES.RECALIBRATE: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.INSERT_PIN },
        { section: SECTIONS.REMOVE_PIN },
        { section: SECTIONS.RESULTS },
      ]
    }
    case GRIPPER_FLOW_TYPES.ATTACH: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.MOUNT_GRIPPER },
        { section: SECTIONS.SUCCESSFULLY_ATTACHED },
        { section: SECTIONS.RESULTS },
      ]
    }
    case GRIPPER_FLOW_TYPES.DETACH: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.UNMOUNT_GRIPPER },
        { section: SECTIONS.RESULTS },
      ]
    }
  }
  return []
}
