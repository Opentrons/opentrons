// @flow
// tip length calibration session constants

export const TIP_LENGTH_STEP_SESSION_STARTED: 'sessionStarted' =
  'sessionStarted'
export const TIP_LENGTH_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET: 'measuringNozzleOffset' =
  'measuringNozzleOffset'
export const TIP_LENGTH_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const TIP_LENGTH_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const TIP_LENGTH_STEP_MEASURING_TIP_OFFSET: 'measuringTipOffset' =
  'measuringTipOffset'
export const TIP_LENGTH_STEP_CALIBRATION_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'

const LOAD_LABWARE: 'calibration.loadLabware' = 'calibration.loadLabware'
const JOG: 'calibration.jog' = 'calibration.jog'
const PICK_UP_TIP: 'calibration.pickUpTip' = 'calibration.pickUpTip'
const CONFIRM_TIP: 'calibration.confirmTip' = 'calibration.confirmTip'
const INVALIDATE_TIP: 'calibration.invalidateTip' = 'calibration.invalidateTip'
const EXIT: 'calibration.exitSession' = 'calibration.exitSession'

export const tipCalCommands = {
  LOAD_LABWARE,
  JOG,
  PICK_UP_TIP,
  CONFIRM_TIP,
  INVALIDATE_TIP,
  EXIT,
}
