export const SECTIONS = {
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  MOUNT_GRIPPER: 'MOUNT_GRIPPER',
  MOVE_PIN: 'MOVE_PIN',
  SUCCESS: 'SUCCESS',
  UNMOUNT_GRIPPER: 'UNMOUNT_GRIPPER',
} as const

export const GRIPPER_FLOW_TYPES = {
  ATTACH: 'ATTACH',
  DETACH: 'DETACH',
  RECALIBRATE: 'RECALIBRATE',
}

// pin movements

export const MOVE_PIN_TO_FRONT_JAW = 'movePinToFrontJaw'
export const MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW = 'movePinFromFrontJawToRearJaw'
export const REMOVE_PIN_FROM_REAR_JAW = 'removePinFromRearJaw'

// successful actions 

export const SUCCESSFULLY_ATTACHED = 'successfullyAttached'
export const SUCCESSFULLY_ATTACHED_AND_CALIBRATED = 'successfullyAttachedAndCalibrated'
export const SUCCESSFULLY_DETACHED = 'successfullyDetached'
export const SUCCESSFULLY_CALIBRATED = 'successfullyCalibrated'

//  required equipment list
export const CAL_PIN_LOADNAME = 'calibration_pin'
export const SCREWDRIVER_LOADNAME = 't10_torx_screwdriver'
export const GRIPPER_LOADNAME = 'opentrons_gripper'


