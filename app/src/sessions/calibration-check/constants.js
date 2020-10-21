// @flow
// calibration check session contants

import { sharedCalCommands } from '../common-calibration/constants'

export const CHECK_STEP_SESSION_STARTED: 'sessionStarted' = 'sessionStarted'
export const CHECK_STEP_LABWARE_LOADED: 'labwareLoaded' = 'labwareLoaded'
export const CHECK_STEP_PREPARING_PIPETTE: 'preparingPipette' =
  'preparingPipette'
export const CHECK_STEP_INSPECTING_TIP: 'inspectingTip' = 'inspectingTip'
export const CHECK_STEP_COMPARING_HEIGHT: 'comparingHeight' = 'comparingHeight'
export const CHECK_STEP_COMPARING_POINT_ONE: 'comparingPointOne' =
  'comparingPointOne'
export const CHECK_STEP_COMPARING_POINT_TWO: 'comparingPointTwo' =
  'comparingPointTwo'
export const CHECK_STEP_COMPARING_POINT_THREE: 'comparingPointThree' =
  'comparingPointThree'
export const CHECK_STEP_CHECK_COMPLETE: 'calibrationComplete' =
  'calibrationComplete'
export const CHECK_STEP_SESSION_EXITED: 'sessionExited' = 'sessionExited'
export const CHECK_STEP_BAD_ROBOT_CALIBRATION: 'badCalibrationData' =
  'badCalibrationData'
export const CHECK_STEP_RETURNING_TIP: 'returningTip' = 'returningTip'
export const CHECK_STEP_RESULTS_SUMMARY: 'resultsSummary' = 'resultsSummary'
export const CHECK_STEP_NO_PIPETTES_ATTACHED: 'noPipettesAttached' =
  'noPipettesAttached'

const CHECK_SWITCH_PIPETTE: 'calibration.check.switchPipette' =
  'calibration.check.switchPipette'
const COMPARE_POINT: 'calibration.check.comparePoint' =
  'calibration.check.comparePoint'
const RETURN_TIP: 'calibration.check.returnTip' = 'calibration.check.returnTip'
const TRANSITION: 'calibration.check.transition' =
  'calibration.check.transition'
const EXIT: 'calibration.exitSession' = 'calibration.exitSession'

export const checkCommands = {
  ...sharedCalCommands,
  CHECK_SWITCH_PIPETTE,
  COMPARE_POINT,
  TRANSITION,
  RETURN_TIP,
  EXIT,
}

export const CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET = 'BAD_INSTRUMENT_OFFSET'
export const CHECK_TRANSFORM_TYPE_UNKNOWN = 'UNKNOWN'
export const CHECK_TRANSFORM_TYPE_DECK = 'BAD_DECK_TRANSFORM'

export const CHECK_PIPETTE_RANK_FIRST: 'first' = 'first'
export const CHECK_PIPETTE_RANK_SECOND: 'second' = 'second'

export const FIRST_PIPETTE_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
]

export const SECOND_PIPETTE_COMPARISON_STEPS = [
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
]
