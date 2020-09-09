// @flow
// deck calibration sessioin constants

import { sharedCalCommands } from '../common-calibration/constants'

export const DECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const DECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const DECK_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const DECK_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const DECK_STEP_JOGGING_TO_DECK: 'joggingToDeck' = 'joggingToDeck'
export const DECK_STEP_SAVING_POINT_ONE: 'savingPointOne' = 'savingPointOne'
export const DECK_STEP_SAVING_POINT_TWO: 'savingPointTwo' = 'savingPointTwo'
export const DECK_STEP_SAVING_POINT_THREE: 'savingPointThree' =
  'savingPointThree'
export const DECK_STEP_CALIBRATION_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'

const MOVE_TO_POINT_TWO: 'calibration.deck.moveToPointTwo' =
  'calibration.deck.moveToPointTwo'
const MOVE_TO_POINT_THREE: 'calibration.deck.moveToPointThree' =
  'calibration.deck.moveToPointThree'

export const deckCalCommands = {
  ...sharedCalCommands,
  MOVE_TO_POINT_TWO,
  MOVE_TO_POINT_THREE,
}
