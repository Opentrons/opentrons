// @flow
// pipette offset calibration session constants

export const PIP_OFFSET_STEP_SESSION_STARTED: 'sessionStarted' =
  'sessionStarted'
export const PIP_OFFSET_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const PIP_OFFSET_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const PIP_OFFSET_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const PIP_OFFSET_STEP_JOGGING_TO_DECK: 'joggingToDeck' = 'joggingToDeck'
export const PIP_OFFSET_STEP_SAVING_POINT_ONE: 'savingPointOne' =
  'savingPointOne'
export const PIP_OFFSET_STEP_CALIBRATION_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'
export const PIP_OFFSET_STEP_SESSION_EXITED: 'sessionExited' = 'sessionExited'

const LOAD_LABWARE: 'calibration.loadLabware' = 'calibration.loadLabware'
const JOG: 'calibration.jog' = 'calibration.jog'
const PICK_UP_TIP: 'calibration.pickUpTip' = 'calibration.pickUpTip'
const INVALIDATE_TIP: 'calibration.invalidateTip' = 'calibration.invalidateTip'
const MOVE_TO_DECK: 'calibration.moveToDeck' = 'calibration.moveToDeck'
const MOVE_TO_POINT_ONE: 'calibration.moveToPointOne' =
  'calibration.moveToPointOne'
const MOVE_TO_TIP_RACK: 'calibration.moveToTipRack' =
  'calibration.moveToTipRack'
const SAVE_OFFSET: 'calibration.saveOffset' = 'calibration.saveOffset'
const EXIT: 'calibration.exitSession' = 'calibration.exitSession'

export const pipOffsetCalCommands = {
  LOAD_LABWARE,
  JOG,
  PICK_UP_TIP,
  INVALIDATE_TIP,
  MOVE_TO_DECK,
  MOVE_TO_POINT_ONE,
  MOVE_TO_TIP_RACK,
  SAVE_OFFSET,
  EXIT,
}
