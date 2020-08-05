// @flow
// deck calibration sessioin constants

export const DECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const DECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const DECK_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const DECK_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const DECK_STEP_JOGGING_TO_DECK: 'joggingToDeck' = 'joggingToDeck'
export const DECK_STEP_SAVING_POINT_ONE: 'savingPointOne' = 'savingPointOne'
export const DECK_STEP_SAVING_POINT_TWO: 'savingPointTwo' = 'savingPointTwo'
export const DECK_STEP_SAVING_POINT_THREE: 'savingPointThree' = 'savingPointThree'
export const DECK_STEP_CALIBRATION_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'

const LOAD_LABWARE: 'calibration.loadLabware' = 'calibration.loadLabware'
const JOG: 'calibration.jog' = 'calibration.jog'
const PICK_UP_TIP: 'calibration.pickUpTip' = 'calibration.pickUpTip'
const CONFIRM_TIP: 'calibration.confirmTip' = 'calibration.confirmTip'
const INVALIDATE_TIP: 'calibration.invalidateTip' = 'calibration.invalidateTip'
const SAVE_OFFSET: 'calibration.saveOffset' = 'calibration.saveOffset'
const EXIT: 'calibration.exitSession' = 'calibration.exitSession'
const MOVE_TO_TIP_RACK: 'calibration.deck.moveToTipRack' = 'calibration.deck.moveToTipRack'
const MOVE_TO_DECK: 'calibration.deck.moveToDeck' = 'calibration.deck.moveToDeck'
const MOVE_TO_POINT_ONE: 'calibration.deck.moveToPointOne' = 'calibration.deck.moveToPointOne'
const MOVE_TO_POINT_TWO: 'calibration.deck.moveToPointTwo' = 'calibration.deck.moveToPointTwo'
const MOVE_TO_POINT_THREE: 'calibration.deck.moveToPointThree' = 'calibration.deck.moveToPointThree'

export const deckCalCommands = {
  LOAD_LABWARE,
  JOG,
  PICK_UP_TIP,
  CONFIRM_TIP,
  INVALIDATE_TIP,
  SAVE_OFFSET,
  EXIT,
  MOVE_TO_TIP_RACK,
  MOVE_TO_DECK,
  MOVE_TO_POINT_ONE,
  MOVE_TO_POINT_TWO,
  MOVE_TO_POINT_THREE,
}