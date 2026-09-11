export const ROBOT_CALIBRATION_STEP_KEY: 'robot_calibration_step' =
  'robot_calibration_step'
export const MODULE_SETUP_STEP_KEY: 'module_setup_step' = 'module_setup_step'
export const LPC_STEP_KEY: 'labware_position_check_step' =
  'labware_position_check_step'
export const LABWARE_SETUP_STEP_KEY: 'labware_liquids_setup_step' =
  'labware_liquids_setup_step'
export const CAMERA_SETUP_STEP_KEY: 'camera_setup_step' = 'camera_setup_step'

export const SETUP_STEP_KEYS = [
  ROBOT_CALIBRATION_STEP_KEY,
  MODULE_SETUP_STEP_KEY,
  LPC_STEP_KEY,
  LABWARE_SETUP_STEP_KEY,
  CAMERA_SETUP_STEP_KEY,
] as const

export const STEP_KEY_TO_I18N_KEY = {
  [LPC_STEP_KEY]: 'applied_labware_offsets',
  [LABWARE_SETUP_STEP_KEY]: 'labware_placement',
  [MODULE_SETUP_STEP_KEY]: 'module_setup',
  [ROBOT_CALIBRATION_STEP_KEY]: 'robot_calibration',
  [CAMERA_SETUP_STEP_KEY]: 'camera_settings',
}
