import {
  GRIPPER_FLOW_TYPES,
  SECTIONS,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  SUCCESSFULLY_ATTACHED,
  SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
  SUCCESSFULLY_DETACHED,
  SUCCESSFULLY_CALIBRATED,
} from './constants'
import type { GripperWizardStep, GripperWizardFlowType } from './types'

export const getGripperWizardSteps = (
  flowType: GripperWizardFlowType
): GripperWizardStep[] => {
  switch (flowType) {
    case GRIPPER_FLOW_TYPES.RECALIBRATE: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.MOVE_PIN, movement: MOVE_PIN_TO_FRONT_JAW },
        {
          section: SECTIONS.MOVE_PIN,
          movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
        },
        { section: SECTIONS.MOVE_PIN, movement: REMOVE_PIN_FROM_REAR_JAW },
        {
          section: SECTIONS.SUCCESS,
          successfulAction: SUCCESSFULLY_CALIBRATED,
        },
      ]
    }
    case GRIPPER_FLOW_TYPES.ATTACH: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.MOUNT_GRIPPER },
        { section: SECTIONS.FIRMWARE_UPDATE },
        { section: SECTIONS.SUCCESS, successfulAction: SUCCESSFULLY_ATTACHED },
        { section: SECTIONS.MOVE_PIN, movement: MOVE_PIN_TO_FRONT_JAW },
        {
          section: SECTIONS.MOVE_PIN,
          movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
        },
        { section: SECTIONS.MOVE_PIN, movement: REMOVE_PIN_FROM_REAR_JAW },
        {
          section: SECTIONS.SUCCESS,
          successfulAction: SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
        },
      ]
    }
    case GRIPPER_FLOW_TYPES.DETACH: {
      return [
        { section: SECTIONS.BEFORE_BEGINNING },
        { section: SECTIONS.UNMOUNT_GRIPPER },
        { section: SECTIONS.SUCCESS, successfulAction: SUCCESSFULLY_DETACHED },
      ]
    }
  }
  return []
}
